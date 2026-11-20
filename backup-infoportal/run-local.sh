#!/usr/bin/env bash
# Runs the backup image on your machine against a real environment, writing to a local folder,
# or with --to-r2 to the environment's R2 backup bucket. Used to test the image before it runs as a
# CronJob in AKS.
#
# Needs the same access as scripts/db (VPN, az login, DIS AzSQL Admin Dev IP), plus a role on the
# media storage account that allows a user delegation SAS (as scripts/blobs uses).

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
IMAGE="infoportal-backup:local"

usage() {
	cat <<EOF
Usage: $(basename "$0") <env> [options]

  env             at22 | at23 | tt02 | prod (servers are read from scripts/db/environments.conf)

Options:
  --out DIR       where backups go (default: ~/infoportal-backup-test/<env>). Kept outside the repo
                  on purpose: it holds real data.
  --skip-db       only mirror media
  --skip-media    only back up the database
  --to-r2         write to r2:infoportal-backup-<env> instead of the local folder. R2 credentials are
                  read from <out>/r2.env (RCLONE_CONFIG_R2_ACCESS_KEY_ID, _SECRET_ACCESS_KEY, _ENDPOINT).
  --r2-env FILE   read R2 credentials from FILE instead
  --dns SERVER    look up the SQL server's address with this DNS server and pass it to the container.
                  For when the system resolver returns the public address, e.g. in WSL with Tailscale:
                  --dns 100.100.100.100
  --mtu N         run the container in a Docker network with this MTU instead of the host network. For when
                  large packets are lost on the way, e.g. Tailscale in WSL where eth0 has MTU 1280: the
                  connection opens, but the login (which carries the Entra token) fails with
                  "an error occurred during the login process".
  --tailscale     same as --dns 100.100.100.100 --mtu 1200 (Tailscale in WSL)
  --no-build      reuse the existing $IMAGE image
  -h, --help      show this help
EOF
}

log() { printf '[run-local] %s\n' "$*" >&2; }
die() { log "ERROR: $*"; exit 1; }

ENV_NAME="${1:-}"
case "$ENV_NAME" in -h | --help | "") usage; exit 0 ;; esac
shift

OUT_DIR="$HOME/infoportal-backup-test/$ENV_NAME"
SKIP_DB=false
SKIP_MEDIA=false
BUILD=true
TO_R2=false
R2_ENV=""
DNS_SERVER=""
MTU=""
while [ $# -gt 0 ]; do
	case "$1" in
	--out) OUT_DIR="$2"; shift 2 ;;
	--skip-db) SKIP_DB=true; shift ;;
	--skip-media) SKIP_MEDIA=true; shift ;;
	--to-r2) TO_R2=true; shift ;;
	--r2-env) R2_ENV="$2"; shift 2 ;;
	--dns) DNS_SERVER="$2"; shift 2 ;;
	--mtu) MTU="$2"; shift 2 ;;
	--tailscale) DNS_SERVER=100.100.100.100; MTU=1200; shift ;;
	--no-build) BUILD=false; shift ;;
	-h | --help) usage; exit 0 ;;
	*) die "unknown option $1" ;;
	esac
done

command -v docker >/dev/null || die "docker is required"
command -v az >/dev/null || die "the Azure CLI is required (az login)"

read -r SQL_SERVER MEDIA_ACCOUNT < <(awk -v env="$ENV_NAME" '$1 == env { print $2, $3 }' "$REPO_ROOT/scripts/db/environments.conf")
[ -n "${SQL_SERVER:-}" ] || die "unknown environment $ENV_NAME (see scripts/db/environments.conf)"

if $BUILD; then
	log "building $IMAGE"
	docker build -q -t "$IMAGE" "$SCRIPT_DIR" >/dev/null
fi

mkdir -p "$OUT_DIR"
chmod 700 "$OUT_DIR"

# Values are passed to docker by name (-e NAME), so tokens never appear on a command line.
export SQL_ACCESS_TOKEN="" MEDIA_SAS_URL=""
if [ "$SKIP_DB" != true ]; then
	log "getting an Entra token for the database"
	SQL_ACCESS_TOKEN="$(az account get-access-token --resource https://database.windows.net/ --query accessToken -o tsv)" ||
		die "could not get a database token. Run 'az login'."
fi
if [ "$SKIP_MEDIA" != true ]; then
	log "creating a read-only user delegation SAS for $MEDIA_ACCOUNT/umbraco (valid 2 hours)"
	SAS="$(az storage container generate-sas --account-name "$MEDIA_ACCOUNT" --name umbraco --permissions rl \
		--expiry "$(date -u -d '+2 hours' +%Y-%m-%dT%H:%MZ)" --https-only --auth-mode login --as-user -o tsv)" ||
		die "could not create a SAS for $MEDIA_ACCOUNT"
	MEDIA_SAS_URL="https://${MEDIA_ACCOUNT}.blob.core.windows.net/umbraco?${SAS}"
fi

# Looks up an A record directly with a given DNS server, without dig or nslookup. Prints the first address.
resolve_a() {
	python3 - "$1" "$2" <<'EOF'
import random, socket, struct, sys
name, server = sys.argv[1], sys.argv[2]
tid = random.randrange(65536)
query = struct.pack(">HHHHHH", tid, 0x0100, 1, 0, 0, 0)
query += b"".join(bytes([len(p)]) + p.encode() for p in name.rstrip(".").split(".")) + b"\0"
query += struct.pack(">HH", 1, 1)
sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
sock.settimeout(5)
sock.sendto(query, (server, 53))
r = sock.recv(4096)
if struct.unpack(">H", r[:2])[0] != tid or r[3] & 0x0F:
    sys.exit("bad DNS response (rcode %d)" % (r[3] & 0x0F))
qd, an = struct.unpack(">HH", r[4:8])

def skip_name(i):
    while True:
        n = r[i]
        if n == 0:
            return i + 1
        if n & 0xC0 == 0xC0:
            return i + 2
        i += n + 1

i = 12
for _ in range(qd):
    i = skip_name(i) + 4
for _ in range(an):
    i = skip_name(i)
    rtype, rclass, _ttl, rdlen = struct.unpack(">HHIH", r[i:i + 10])
    i += 10
    if rtype == 1 and rclass == 1 and rdlen == 4:
        print(socket.inet_ntoa(r[i:i + 4]))
        sys.exit(0)
    i += rdlen
sys.exit("no A record for " + name)
EOF
}

HOST_ARGS=()
if [ -n "$DNS_SERVER" ] && [ "$SKIP_DB" != true ]; then
	command -v python3 >/dev/null || die "--dns needs python3"
	SQL_IP="$(resolve_a "$SQL_SERVER" "$DNS_SERVER")" || die "could not look up $SQL_SERVER with $DNS_SERVER"
	log "$SQL_SERVER -> $SQL_IP (via $DNS_SERVER)"
	case "$SQL_IP" in
	10.* | 172.1[6-9].* | 172.2[0-9].* | 172.3[01].* | 192.168.*) ;;
	*) die "$DNS_SERVER returned a public address ($SQL_IP) for $SQL_SERVER. Is Tailscale up?" ;;
	esac
	HOST_ARGS=(--add-host "$SQL_SERVER:$SQL_IP")
fi

# --network host by default: the database is a Private Link address reached through the VPN on the host.
NETWORK_ARGS=(--network host)
if [ -n "$MTU" ]; then
	case "$MTU" in '' | *[!0-9]*) die "--mtu must be a number" ;; esac
	NETWORK="infoportal-backup-mtu${MTU}"
	if ! docker network inspect "$NETWORK" >/dev/null 2>&1; then
		log "creating Docker network $NETWORK"
		docker network create --opt "com.docker.network.driver.mtu=${MTU}" "$NETWORK" >/dev/null
	fi
	NETWORK_ARGS=(--network "$NETWORK")
fi

# Targets. R2 credentials go to docker as an env file, so they never appear on a command line.
TARGET_ARGS=(-e DB_TARGET=/out/db -e MEDIA_TARGET=/out/media -e MEDIA_DELETED_TARGET=/out/media-deleted)
if $TO_R2; then
	R2_ENV="${R2_ENV:-$OUT_DIR/r2.env}"
	[ -f "$R2_ENV" ] || die "no R2 credentials in $R2_ENV (see --help)"
	BUCKET="r2:infoportal-backup-${ENV_NAME}"
	TARGET_ARGS=(
		--env-file "$R2_ENV"
		-e RCLONE_CONFIG_R2_TYPE=s3
		-e RCLONE_CONFIG_R2_PROVIDER=Cloudflare
		-e RCLONE_CONFIG_R2_NO_CHECK_BUCKET=true
		-e RCLONE_CONFIG_R2_STORAGE_CLASS=STANDARD
		-e DB_TARGET="$BUCKET/db"
		-e MEDIA_TARGET="$BUCKET/media"
		-e MEDIA_DELETED_TARGET="$BUCKET/media-deleted"
	)
fi

# The files written to the mounted folder must belong to you. With rootless Docker, container root
# is mapped to your own user (and any other container uid to an unrelated subuid), so run as root
# there. With normal Docker, run as your own uid.
if docker info --format '{{.SecurityOptions}}' 2>/dev/null | grep -q rootless; then
	CONTAINER_USER="0:0"
else
	CONTAINER_USER="$(id -u):$(id -g)"
fi

log "running backup for $ENV_NAME -> $($TO_R2 && echo "$BUCKET" || echo "$OUT_DIR")"
docker run --rm \
	"${NETWORK_ARGS[@]}" \
	"${HOST_ARGS[@]}" \
	--user "$CONTAINER_USER" \
	-e HOME=/tmp \
	-e ENV_NAME="$ENV_NAME" \
	-e SQL_SERVER="$SQL_SERVER" \
	-e MEDIA_ACCOUNT="$MEDIA_ACCOUNT" \
	"${TARGET_ARGS[@]}" \
	-e SKIP_DB="$SKIP_DB" \
	-e SKIP_MEDIA="$SKIP_MEDIA" \
	-e SQL_ACCESS_TOKEN \
	-e MEDIA_SAS_URL \
	-v "$OUT_DIR:/out" \
	"$IMAGE"

if $TO_R2; then
	log "done. Restore with: backup-infoportal/restore.sh $ENV_NAME"
else
	log "done. Contents of $OUT_DIR:"
	ls -la "$OUT_DIR" "$OUT_DIR/db" >&2 || true
fi
