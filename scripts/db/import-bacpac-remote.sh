#!/usr/bin/env bash
#
# Import a .bacpac into AzureSQL.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
. "$SCRIPT_DIR/lib.sh"

ENV_FILE="$SCRIPT_DIR/.env"

usage() {
  cat >&2 <<EOF
usage: import-bacpac-remote.sh <env> <file.bacpac>

  <env>              one of: $(list_environments)
  <file.bacpac>      bacpac file to import
EOF
  exit 1
}

ENV_NAME="$1"
BACPAC="$2"

[ -n "$ENV_NAME" ] || usage
[ -n "$BACPAC" ] || usage
[ -f "$BACPAC" ] || die "no such file: $BACPAC"

ENV_OUTPUT="$(resolve_environment "$ENV_NAME")"
read -r HOST BLOB_ACCOUNT <<EOF
$ENV_OUTPUT
EOF

require_sqlpackage
require_sqlcmd
SQLPACKAGE="$(find_sqlpackage)"

CONN="Server=tcp:$HOST,1433; Initial Catalog=umbraco2; Encrypt=True; TrustServerCertificate=True"
DB_TOKEN="$(get_db_access_token)"

log "importing $(basename "$BACPAC") ..."
START="$(date +%s)"
"$SQLPACKAGE" /Action:Import  \
  /SourceFile:"$BACPAC" \
  /AccessToken:"$DB_TOKEN" \
  /TargetConnectionString:"$CONN" || die "import failed."
log "imported in $(( $(date +%s) - START ))s"


