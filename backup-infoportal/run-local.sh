#!/usr/bin/env bash
# Runs the backup image on your machine against a real environment, writing to a local folder
# instead of R2. Used to test the image before it runs as a CronJob in AKS.
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
                  on purpose: it holds real data and the local test decryption key.
  --skip-db       only mirror media
  --skip-media    only back up the database
  --no-build      reuse the existing $IMAGE image
  -h, --help      show this help

The database backup is encrypted to a local test key, created on first run in <out>/age-key.txt.
Decrypt with:  age --decrypt -i <out>/age-key.txt -o umbraco.bacpac <file>.bacpac.age
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
while [ $# -gt 0 ]; do
	case "$1" in
	--out) OUT_DIR="$2"; shift 2 ;;
	--skip-db) SKIP_DB=true; shift ;;
	--skip-media) SKIP_MEDIA=true; shift ;;
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
if [ ! -f "$OUT_DIR/age-key.txt" ]; then
	log "creating local test key $OUT_DIR/age-key.txt"
	docker run --rm --entrypoint age-keygen "$IMAGE" >"$OUT_DIR/age-key.txt" 2>/dev/null
	chmod 600 "$OUT_DIR/age-key.txt"
fi
AGE_RECIPIENT="$(grep -o 'age1[0-9a-z]*' "$OUT_DIR/age-key.txt" | head -n1)"

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

# The files written to the mounted folder must belong to you. With rootless Docker, container root
# is mapped to your own user (and any other container uid to an unrelated subuid), so run as root
# there. With normal Docker, run as your own uid.
if docker info --format '{{.SecurityOptions}}' 2>/dev/null | grep -q rootless; then
	CONTAINER_USER="0:0"
else
	CONTAINER_USER="$(id -u):$(id -g)"
fi

log "running backup for $ENV_NAME -> $OUT_DIR"
# --network host: the database is a Private Link address that only resolves through the VPN on the host.
docker run --rm \
	--network host \
	--user "$CONTAINER_USER" \
	-e HOME=/tmp \
	-e ENV_NAME="$ENV_NAME" \
	-e SQL_SERVER="$SQL_SERVER" \
	-e AGE_RECIPIENT="$AGE_RECIPIENT" \
	-e DB_TARGET=/out/db \
	-e MEDIA_ACCOUNT="$MEDIA_ACCOUNT" \
	-e MEDIA_TARGET=/out/media \
	-e SKIP_DB="$SKIP_DB" \
	-e SKIP_MEDIA="$SKIP_MEDIA" \
	-e SQL_ACCESS_TOKEN \
	-e MEDIA_SAS_URL \
	-v "$OUT_DIR:/out" \
	"$IMAGE"

log "done. Contents of $OUT_DIR:"
ls -la "$OUT_DIR" "$OUT_DIR/db" >&2 || true
