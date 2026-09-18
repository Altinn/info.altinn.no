#!/usr/bin/env bash
#
# Copy an environment's database into a local container, end to end.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
. "$SCRIPT_DIR/lib.sh"

usage() {
  cat >&2 <<EOF
usage: refresh-local-db.sh <env> [--skip-export] [--keep-container] [--port N]
                          [--auth METHOD] [--user ENTRA_EMAIL]

  <env>              one of: $(list_environments)
  --skip-export      reuse the newest existing .bacpac for this environment
  --keep-container   import into the running container instead of recreating it
  --port N           host port for the container (default 1433)
  --auth METHOD      password (default) or token; passed to export-bacpac.sh.
                     Use token where Entra blocks password (ROPC) auth.
  --user EMAIL       Entra ID account; passed to export-bacpac.sh
EOF
  exit 1
}

ENV_NAME=""
SKIP_EXPORT=0
KEEP_CONTAINER=0
PORT_ARGS=""
EXPORT_ARGS=""

while [ $# -gt 0 ]; do
  case "$1" in
    --skip-export)    SKIP_EXPORT=1; shift ;;
    --keep-container) KEEP_CONTAINER=1; shift ;;
    --port)           [ $# -ge 2 ] || usage; PORT_ARGS="--port $2"; shift 2 ;;
    --auth)           [ $# -ge 2 ] || usage; EXPORT_ARGS="$EXPORT_ARGS --auth $2"; shift 2 ;;
    --user)           [ $# -ge 2 ] || usage; EXPORT_ARGS="$EXPORT_ARGS --user $2"; shift 2 ;;
    -h|--help) usage ;;
    -*) log "unknown option: $1"; usage ;;
    *)  [ -z "$ENV_NAME" ] || usage; ENV_NAME="$1"; shift ;;
  esac
done

[ -n "$ENV_NAME" ] || usage
resolve_environment "$ENV_NAME" >/dev/null

BACPAC_DIR="$INFOPORTAL_REPO_ROOT/.bacpacs"

if [ "$SKIP_EXPORT" -eq 1 ]; then
  # Filenames are ENV-umbraco-TIMESTAMP.bacpac, a fixed alnum/dash charset from
  # export-bacpac.sh; ls -t is sufficient and simpler than find here.
  # shellcheck disable=SC2012
  BACPAC="$(ls -t "$BACPAC_DIR/$ENV_NAME-umbraco-"*.bacpac 2>/dev/null | head -1 || true)"
  [ -n "$BACPAC" ] || die "no existing .bacpac for '$ENV_NAME' in $BACPAC_DIR"
  log "==> reusing $(basename "$BACPAC")"
else
  log "==> step 1/3: exporting from $ENV_NAME"
  # shellcheck disable=SC2086
  BACPAC="$("$SCRIPT_DIR/export-bacpac.sh" "$ENV_NAME" $EXPORT_ARGS | tail -1)"
fi

log "==> step 2/3: starting the local container"
KEEP_ARG=""
[ "$KEEP_CONTAINER" -eq 1 ] && KEEP_ARG="--keep"
# shellcheck disable=SC2086
SA_PASSWORD="$("$SCRIPT_DIR/start-sqlserver.sh" $KEEP_ARG $PORT_ARGS | tail -1)"

log "==> step 3/3: importing"
# shellcheck disable=SC2086
"$SCRIPT_DIR/import-bacpac.sh" "$BACPAC" $PORT_ARGS

# shellcheck source=/dev/null
. "$SCRIPT_DIR/.env"

DSN="Server=localhost,${MSSQL_PORT};Database=umbraco;User Id=sa;Password=${SA_PASSWORD};TrustServerCertificate=True;Encrypt=False;MultipleActiveResultSets=True"
LOCAL_SETTINGS="$INFOPORTAL_REPO_ROOT/umbraco-infoportal/appsettings.Local.json"
MARKER='"_generatedBy": "scripts/db/refresh-local-db.sh"'

# Write the connection string where Umbraco will pick it up on its own.
# appsettings.Local.json is git-ignored and Development-only, so the tracked
# appsettings.Development.json stays identical to main.
#
# Refuse to clobber a file we did not write: a developer may keep their own
# local overrides here, and silently overwriting them would be the kind of
# quiet destruction this tooling is meant to avoid.
if [ -f "$LOCAL_SETTINGS" ] && ! grep -qF "$MARKER" "$LOCAL_SETTINGS"; then
  log ""
  log "NOTE: $LOCAL_SETTINGS exists and was not written by this script, so it"
  log "was left untouched. Add the connection string below to it by hand."
  WROTE_LOCAL=0
else
  umask 077
  # uSync's ExportOnSave defaults to "All", so working against a copied
  # environment writes that environment's whole schema and content to disk --
  # thousands of generated files sitting next to tracked ones, easy to commit by
  # accident. Turn the automatic export off locally; exporting by hand from the
  # backoffice still works, which is how uSync files are meant to be produced.
  cat >"$LOCAL_SETTINGS" <<EOF
{
  $MARKER,
  "_warning": "Local developer overrides. Contains a local database password. Git-ignored - never commit.",
  "ConnectionStrings": {
    "umbracoDbDSN": "$DSN",
    "umbracoDbDSN_ProviderName": "Microsoft.Data.SqlClient"
  },
  "uSync": {
    "Settings": {
      "ExportOnSave": "None",
      "ExportAtStartup": "None"
    }
  }
}
EOF
  chmod 600 "$LOCAL_SETTINGS"
  WROTE_LOCAL=1
fi

cat <<EOF

Done. Local database ready.
EOF

if [ "$WROTE_LOCAL" -eq 1 ]; then
  cat <<EOF

Wrote the connection string to:
  umbraco-infoportal/appsettings.Local.json

Umbraco reads that automatically in Development, so just start the app.
The file is git-ignored and holds a local password - do not commit it.
EOF
else
  cat <<EOF

  "ConnectionStrings": {
    "umbracoDbDSN": "$DSN",
    "umbracoDbDSN_ProviderName": "Microsoft.Data.SqlClient"
  }
EOF
fi

cat <<EOF

Or run Umbraco with:

  export ConnectionStrings__umbracoDbDSN="$DSN"

Media lives in Azure Blob Storage, so images will not resolve locally.
Log in with the backoffice users from ${ENV_NAME}.
EOF
