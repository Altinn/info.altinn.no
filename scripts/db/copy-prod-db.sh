#!/usr/bin/env bash
#
# Copy the prod database into another environment
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
. "$SCRIPT_DIR/lib.sh"

usage() {
  cat >&2 <<EOF
usage: copy-prod-db.sh <env> [--skip-export] [--auth METHOD] [--user ENTRA_EMAIL]

  <env>              one of: $(list_environments)
  --skip-export      reuse the newest existing .bacpac for this environment
  --auth METHOD      password (default) or token; passed to export-bacpac.sh.
                     Use token where Entra blocks password (ROPC) auth.
  --user EMAIL       Entra ID account; passed to export-bacpac.sh
EOF
  exit 1
}

ENV_NAME=""
SKIP_EXPORT=0
EXPORT_ARGS=""

while [ $# -gt 0 ]; do
  case "$1" in
    --skip-export)    SKIP_EXPORT=1; shift ;;
    --auth)           [ $# -ge 2 ] || usage; EXPORT_ARGS="$EXPORT_ARGS --auth $2"; shift 2 ;;
    --user)           [ $# -ge 2 ] || usage; EXPORT_ARGS="$EXPORT_ARGS --user $2"; shift 2 ;;
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

if [ "$SKIP_EXPORT" -eq 1 ]; then
  # Filenames are ENV-umbraco-TIMESTAMP.bacpac, a fixed alnum/dash charset from
  # export-bacpac.sh; ls -t is sufficient and simpler than find here.
  BACPAC="$(ls -t "$BACPAC_DIR/prod-umbraco-"*.bacpac 2>/dev/null | head -1 || true)"
  [ -n "$BACPAC" ] || die "no existing .bacpac for 'prod' in $BACPAC_DIR"
  log "==> steg 1/4: Reusing $(basename "$BACPAC")"
else
  log "==> step 1/4: Exporting from prod"
  BACPAC="$("$SCRIPT_DIR/export-bacpac.sh" "prod" $EXPORT_ARGS | tail -1)"
fi

log "==> step 2/4: Renaming ${ENV_NAME} db to umbraco-old"
run_sqlcmd -S "$HOST,1433" -d master -G -U "$DB_USER" -P "$DB_PASSWORD" -C -Q "alter database umbraco modify name = 'umbraco-old';"

log "==> step 3/4: Importing db in ${ENV_NAME}"
BACPAC="$("$SCRIPT_DIR/import-bacpac.sh" "$ENV_NAME" "$BACPAC" | tail -1)"

log "==> step 4/4: Replacing environment specific data"
run_sqlcmd -S "$HOST,1433" -d umbraco -G -C -U "$DB_USER" -i "sql/replace-env-data-$ENV_NAME.sql"

