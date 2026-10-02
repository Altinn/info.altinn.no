#!/usr/bin/env bash
#
# Copy the prod database into another environment
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
. "$SCRIPT_DIR/lib.sh"


usage() {
  cat >&2 <<EOF
usage: copy-prod-blobs.sh <env>
  <env>              one of: $(list_environments)
EOF
  exit 1
}

ENV_NAME=""

while [ $# -gt 0 ]; do
  case "$1" in
    -h|--help) usage ;;
    -*) log "unknown option: $1"; usage ;;
    *)  [ -z "$ENV_NAME" ] || usage; ENV_NAME="$1"; shift ;;
  esac
done

[ -n "$ENV_NAME" ] || usage
resolve_environment "$ENV_NAME" >/dev/null

BLOB_ACCOUNT="$(resolve_environment "$ENV_NAME")"

log "==> step 1/2: Backing up existing media files in $ENV_NAME"
BLOB_URL="$(get_blob_url $BLOB_ACCOUNT)";
SAS="$(get_blob_sas $BLOB_ACCOUNT)"
run_azcopy "${BLOB_URL}?$SAS" "${BLOB_URL}-backup?$SAS"

log "==> step 2/2: Copying media files from prod to $ENV_NAME"
PROD_BLOB_ACCOUNT="infoportalmediaprodl08r"
PROD_BLOB_URL="$(get_blob_url $PROD_BLOB_ACCOUNT)"
PROD_SAS="$(get_blob_sas $PROD_BLOB_ACCOUNT)"
run_azcopy "${PROD_BLOB_URL}?$PROD_SAS" "${BLOB_URL}?$SAS"


