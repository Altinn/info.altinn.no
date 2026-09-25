#!/usr/bin/env bash
#
# Copy the prod database into another environment
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
. "$SCRIPT_DIR/lib.sh"

usage() {
  cat >&2 <<EOF
usage: import-from-prod-db.sh <env>

  <env>              one of: $(list_environments)
EOF
  exit 1
}

ENV_NAME=""
SKIP_EXPORT=0
EXPORT_ARGS=""

while [ $# -gt 0 ]; do
  case "$1" in
    -h|--help) usage ;;
    -*) log "unknown option: $1"; usage ;;
    *)  [ -z "$ENV_NAME" ] || usage; ENV_NAME="$1"; shift ;;
  esac
done

[ -n "$ENV_NAME" ] || usage
resolve_environment "$ENV_NAME" >/dev/null

ENV_OUTPUT="$(resolve_environment "$ENV_NAME")"
read -r HOST BLOB_ACCOUNT<<EOF
$ENV_OUTPUT
EOF
DB_TOKEN="$(get_db_access_token)"
DB_USER="$(get_db_user)"
DB_PASSWORD="$(get_db_password)"

BACPAC_DIR="$INFOPORTAL_REPO_ROOT/.bacpacs"

log "==> steg 1/4: Finding .bacpac file"
# Filenames are ENV-umbraco-TIMESTAMP.bacpac, a fixed alnum/dash charset from
# export-bacpac.sh; ls -t is sufficient and simpler than find here.
BACPAC="$(ls -t "$BACPAC_DIR/prod-umbraco-"*.bacpac 2>/dev/null | head -1 || true)"
[ -n "$BACPAC" ] || die "no existing .bacpac for 'prod' in $BACPAC_DIR"
log "Found $(basename "$BACPAC")"

log "==> step 2/4: Renaming ${ENV_NAME} db to umbracoold"
run_sqlcmd -S "$HOST,1433" -d master -G -U "$DB_USER" -P "$DB_PASSWORD" -C -Q "alter database umbraco modify name = umbracoold;"

log "==> step 3/4: Importing db in ${ENV_NAME}"
BACPAC="$("$SCRIPT_DIR/import-bacpac-remote.sh" "$ENV_NAME" "$BACPAC" | tail -1)"

log "==> step 4/4: Replacing environment specific data"
run_sqlcmd -S "$HOST,1433" -d umbraco -G -C -U "$DB_USER" -i "sql/replace-env-data-$ENV_NAME.sql"

