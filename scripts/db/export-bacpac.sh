#!/usr/bin/env bash
#
# Export an environment's Umbraco database to a local .bacpac file.
#
# READ-ONLY against the remote server. This script performs exactly two remote
# operations: a TCP reachability check and sqlpackage /Action:Export.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
. "$SCRIPT_DIR/lib.sh"

usage() {
  cat >&2 <<EOF
usage: export-bacpac.sh <env> [--out DIR] [--user ENTRA_EMAIL] [--auth METHOD]

  <env>          environment name; one of: $(list_environments)
  --out DIR      output directory (default: <repo>/.bacpacs)
  --user EMAIL   Entra ID account (default: \$INFOPORTAL_DB_USER, or
                 git config user.email when it is a @digdir.no address)
  --auth METHOD  password (default) or token.

                 'password' uses Authentication=Active Directory Password and
                 prompts. If Entra answers AADSTS50126 even with the correct
                 password, ROPC is blocked for your account -- use token.

                 'token' takes an Entra access token from the Azure CLI
                 (az login required). Nothing is prompted.
EOF
  exit 1
}

ENV_NAME=""
OUT_DIR="$INFOPORTAL_REPO_ROOT/.bacpacs"
DB_USER="${INFOPORTAL_DB_USER:-}"
AUTH_METHOD="password"

while [ $# -gt 0 ]; do
  case "$1" in
    --out)  [ $# -ge 2 ] || usage; OUT_DIR="$2"; shift 2 ;;
    --user) [ $# -ge 2 ] || usage; DB_USER="$2"; shift 2 ;;
    --auth) [ $# -ge 2 ] || usage; AUTH_METHOD="$2"; shift 2 ;;
    -h|--help) usage ;;
    -*) log "unknown option: $1"; usage ;;
    *)  [ -z "$ENV_NAME" ] || usage; ENV_NAME="$1"; shift ;;
  esac
done

case "$AUTH_METHOD" in
  password|token) ;;
  *) log "unknown --auth value '$AUTH_METHOD'"; usage ;;
esac

[ -n "$ENV_NAME" ] || usage

require_sqlpackage
SQLPACKAGE="$(find_sqlpackage)"

ENV_OUTPUT="$(resolve_environment "$ENV_NAME")"
read -r HOST BLOB_ACCOUNT <<EOF
$ENV_OUTPUT
EOF

if [ "$ENV_NAME" = "prod" ]; then
  log ""
  log "You are about to export from PRODUCTION."
  log "The export is read-only, but it puts read load on a live server and"
  log "produces a file containing real personal data."
  printf 'Type the word prod to continue: ' >&2
  read -r CONFIRM
  [ "$CONFIRM" = "prod" ] || die "aborted"
fi

log "checking connectivity to $HOST:1433 ..."
require_remote_reachable "$HOST" 1433

CONN="Server=tcp:$HOST,1433; Initial Catalog=umbraco; Encrypt=True; TrustServerCertificate=True"

if [ "$AUTH_METHOD" = "token" ]; then
   DB_TOKEN="$(get_db_access_token)"
else
  if [ -z "$DB_USER" ]; then
    DB_USER="$(git -C "$INFOPORTAL_REPO_ROOT" config user.email 2>/dev/null || true)"
    case "$DB_USER" in *@digdir.no) ;; *) DB_USER="" ;; esac
  fi

  DB_USER="$(get_db_user)"
  DB_PASSWORD="$(get_db_password)"

  CONN="$CONN; Authentication=Active Directory Password; User ID=$DB_USER; Password=$DB_PASSWORD"
fi

mkdir -p "$OUT_DIR"
TARGET="$OUT_DIR/$ENV_NAME-umbraco-$(date +%Y%m%d-%H%M%S).bacpac"

log "exporting $ENV_NAME (umbraco)) -> $TARGET"
log "this reads the whole database and can take several minutes ..."

if [ "$AUTH_METHOD" = "token" ]; then
  # An access token lasts about an hour. A very large export can outlive it;
  # if that happens, re-run — sqlpackage cannot refresh it mid-flight.
  "$SQLPACKAGE" /Action:Export \
    /SourceConnectionString:"$CONN" \
    /AccessToken:"$DB_TOKEN" \
    /TargetFile:"$TARGET" \
    || die "export failed.

If it says \"Login failed for user '<token-identified principal>'\", your Entra
account authenticated but has no login on this server. Ask for access to be
granted on $HOST."
else
  "$SQLPACKAGE" /Action:Export \
    /SourceConnectionString:"$CONN" \
    /TargetFile:"$TARGET" \
    || die "export failed.

If it says AADSTS50126, Entra rejected the password. That usually means password
(ROPC) authentication is blocked for your account rather than the password being
wrong. Retry with:  $(basename "$0") $ENV_NAME --auth token"
fi

log "exported $(du -h "$TARGET" | cut -f1) to:"
[ -s "$TARGET" ] || die "export reported success but $TARGET is missing or empty"
printf '%s\n' "$TARGET"
