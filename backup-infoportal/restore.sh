#!/usr/bin/env bash
# Restores a database backup from R2 on your machine:
#
#   1. Read latest.json (or use --object) from r2:infoportal-backup-<env>/db
#   2. Download the encrypted backup and check its sha256 against latest.json
#   3. Decrypt it with the environment's age private key, and check the bacpac's sha256
#   4. With --import: import it into the local SQL Server with scripts/db/import-bacpac.sh
#
# rclone and age run in the backup image, so nothing needs to be installed except Docker.
# The private key never leaves your machine.

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
IMAGE="infoportal-backup:local"

usage() {
	cat <<EOF
Usage: $(basename "$0") <env> [options]

Options:
  --object NAME   restore this backup (e.g. umbraco-at22-2026-11-18T02-00-00Z.bacpac.age)
                  instead of the one in latest.json. Use --list to see what exists.
  --list          list the database backups in R2 and exit
  --key FILE      age private key (default: <out>/age-key.txt)
  --r2-env FILE   R2 credentials (default: <out>/r2.env)
  --out DIR       working folder (default: ~/infoportal-backup-test/<env>)
  --import        import the result into the local SQL Server (scripts/db/import-bacpac.sh)
  --db NAME       database name for --import (default: umbraco)
  --no-build      reuse the existing $IMAGE image
  -h, --help      show this help

The decrypted .bacpac is written to <out>/restore/. It contains real data: delete it when done.
EOF
}

log() { printf '[restore] %s\n' "$*" >&2; }
die() { log "ERROR: $*"; exit 1; }

ENV_NAME="${1:-}"
case "$ENV_NAME" in -h | --help | "") usage; exit 0 ;; esac
shift

OUT_DIR="$HOME/infoportal-backup-test/$ENV_NAME"
OBJECT=""
LIST=false
KEY=""
R2_ENV=""
IMPORT=false
DB_NAME="umbraco"
BUILD=true
while [ $# -gt 0 ]; do
	case "$1" in
	--object) OBJECT="$2"; shift 2 ;;
	--list) LIST=true; shift ;;
	--key) KEY="$2"; shift 2 ;;
	--r2-env) R2_ENV="$2"; shift 2 ;;
	--out) OUT_DIR="$2"; shift 2 ;;
	--import) IMPORT=true; shift ;;
	--db) DB_NAME="$2"; shift 2 ;;
	--no-build) BUILD=false; shift ;;
	-h | --help) usage; exit 0 ;;
	*) die "unknown option $1" ;;
	esac
done

KEY="${KEY:-$OUT_DIR/age-key.txt}"
R2_ENV="${R2_ENV:-$OUT_DIR/r2.env}"
SOURCE="r2:infoportal-backup-${ENV_NAME}/db"
RESTORE_DIR="$OUT_DIR/restore"

command -v docker >/dev/null || die "docker is required"
[ -f "$R2_ENV" ] || die "no R2 credentials in $R2_ENV"
case "$OBJECT" in */* | *..*) die "--object must be a file name, not a path" ;; esac

if $BUILD; then
	log "building $IMAGE"
	docker build -q -t "$IMAGE" "$SCRIPT_DIR" >/dev/null
fi

mkdir -p "$RESTORE_DIR"
chmod 700 "$OUT_DIR" "$RESTORE_DIR"

if docker info --format '{{.SecurityOptions}}' 2>/dev/null | grep -q rootless; then
	CONTAINER_USER="0:0"
else
	CONTAINER_USER="$(id -u):$(id -g)"
fi

# Runs a command in the backup image with R2 configured and the restore folder mounted at /work.
in_image() {
	docker run --rm -i \
		--user "$CONTAINER_USER" \
		-e HOME=/tmp \
		--env-file "$R2_ENV" \
		-e RCLONE_CONFIG_R2_TYPE=s3 \
		-e RCLONE_CONFIG_R2_PROVIDER=Cloudflare \
		-e RCLONE_CONFIG_R2_NO_CHECK_BUCKET=true \
		-e RCLONE_CONFIG_R2_STORAGE_CLASS=STANDARD \
		-v "$RESTORE_DIR:/work" \
		--entrypoint "$1" \
		"$IMAGE" "${@:2}"
}

# jq from the image, reading stdin.
jq() { docker run --rm -i --entrypoint jq "$IMAGE" "$@"; }

if $LIST; then
	in_image rclone lsl "$SOURCE"
	exit 0
fi

log "reading ${SOURCE}/latest.json"
in_image rclone copyto "$SOURCE/latest.json" /work/latest.json || die "could not read latest.json"
LATEST="$RESTORE_DIR/latest.json"
jq . <"$LATEST" >&2

if [ -z "$OBJECT" ]; then
	OBJECT="$(jq -er '.object' <"$LATEST")" || die "latest.json has no object"
	EXPECT_ENCRYPTED="$(jq -er '.encrypted.sha256' <"$LATEST")"
	EXPECT_PLAIN="$(jq -er '.bacpac.sha256' <"$LATEST")"
else
	# Checksums are only recorded for the latest backup.
	if [ "$(jq -r '.object' <"$LATEST")" = "$OBJECT" ]; then
		EXPECT_ENCRYPTED="$(jq -er '.encrypted.sha256' <"$LATEST")"
		EXPECT_PLAIN="$(jq -er '.bacpac.sha256' <"$LATEST")"
	else
		log "note: $OBJECT is not the latest backup, so there are no checksums to compare with"
		EXPECT_ENCRYPTED=""
		EXPECT_PLAIN=""
	fi
fi
case "$OBJECT" in */* | *..* | "") die "unexpected object name '$OBJECT'" ;; esac

log "downloading $OBJECT"
in_image rclone copyto "$SOURCE/$OBJECT" "/work/$OBJECT" --stats-one-line --stats=30s || die "download failed"

ENCRYPTED="$RESTORE_DIR/$OBJECT"
if [ -n "$EXPECT_ENCRYPTED" ]; then
	echo "$EXPECT_ENCRYPTED  $ENCRYPTED" | sha256sum -c --quiet - || die "encrypted file does not match latest.json"
	log "encrypted file matches latest.json"
fi

[ -f "$KEY" ] || die "no age private key in $KEY"
BACPAC="$RESTORE_DIR/${OBJECT%.age}"
log "decrypting to $BACPAC"
# The key is passed on stdin, so it is not mounted into the container.
in_image sh -c 'age --decrypt -i - -o "/work/$1" "/work/$2"' sh "${OBJECT%.age}" "$OBJECT" <"$KEY" || die "decryption failed (wrong key?)"
rm -f "$ENCRYPTED"

if [ -n "$EXPECT_PLAIN" ]; then
	echo "$EXPECT_PLAIN  $BACPAC" | sha256sum -c --quiet - || die "decrypted bacpac does not match latest.json"
	log "decrypted bacpac matches latest.json"
fi

if $IMPORT; then
	log "importing into local database '$DB_NAME'"
	"$REPO_ROOT/scripts/db/import-bacpac.sh" "$BACPAC" --db "$DB_NAME"
fi

log "done: $BACPAC"
