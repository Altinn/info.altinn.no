#!/usr/bin/env bash
# Nightly backup of Umbraco to Cloudflare R2: exports the database to a .bacpac (unencrypted) with a
# latest.json receipt, and mirrors the media container. Targets are rclone paths, so tests can write locally.
#
# Environment variables:
#   ENV_NAME              at22 | at23 | tt02 | prod (required)
#   SQL_SERVER            Azure SQL host
#   SQL_DATABASE          default: umbraco
#   DB_TARGET             e.g. r2:infoportal-backup-at22/db
#   MEDIA_ACCOUNT         storage account with Umbraco media
#   MEDIA_CONTAINER       default: umbraco
#   MEDIA_SOURCE_PREFIX   default: media (skips cache/ and media-backup/, which are not needed)
#   MEDIA_TARGET          e.g. r2:infoportal-backup-at22/media
#   MEDIA_DELETED_TARGET  deleted and overwritten files are moved to <this>/<time>/. If empty, they are removed.
#   MEDIA_MAX_DELETE      default: 200
#   SKIP_DB, SKIP_MEDIA   "true" to skip a part
#   EXPORT_TIMEOUT_SECONDS  default: 1800
#   WORK_DIR              default: /tmp/backup
#   SQL_ACCESS_TOKEN, MEDIA_SAS_URL  for local runs; in AKS, workload identity is used
#   RCLONE_CONFIG_R2_*    the "r2" rclone remote (see README)

set -Eeuo pipefail

log() { printf '%s [backup-infoportal] %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*" >&2; }
die() { log "ERROR: $*"; exit 1; }
is_true() { [ "${1:-}" = "true" ]; }

ENV_NAME="${ENV_NAME:-}"
SQL_DATABASE="${SQL_DATABASE:-umbraco}"
MEDIA_CONTAINER="${MEDIA_CONTAINER:-umbraco}"
MEDIA_SOURCE_PREFIX="${MEDIA_SOURCE_PREFIX-media}"
MEDIA_MAX_DELETE="${MEDIA_MAX_DELETE:-200}"
WORK_DIR="${WORK_DIR:-/tmp/backup}"
RCLONE_FLAGS=(--stats=60s --stats-one-line --stats-log-level NOTICE)

[ -n "$ENV_NAME" ] || die "ENV_NAME is required"

# Exchanges the workload identity's federated token for an Entra access token.
workload_identity_token() {
	local scope="$1"
	[ -n "${AZURE_FEDERATED_TOKEN_FILE:-}" ] || die "no SQL_ACCESS_TOKEN and no workload identity (AZURE_FEDERATED_TOKEN_FILE) available"

	curl -fsS -X POST "${AZURE_AUTHORITY_HOST%/}/${AZURE_TENANT_ID}/oauth2/v2.0/token" \
		--data-urlencode "client_id=${AZURE_CLIENT_ID}" \
		--data-urlencode "scope=${scope}" \
		--data-urlencode "grant_type=client_credentials" \
		--data-urlencode "client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer" \
		--data-urlencode "client_assertion=$(cat "$AZURE_FEDERATED_TOKEN_FILE")" |
		jq -er '.access_token' || die "could not get an Entra token for ${scope}"
}

sql_token() {
	if [ -n "${SQL_ACCESS_TOKEN:-}" ]; then
		printf '%s' "$SQL_ACCESS_TOKEN"
	else
		workload_identity_token "https://database.windows.net/.default"
	fi
}

configure_media_remote() {
	export RCLONE_CONFIG_AZ_TYPE=azureblob
	if [ -n "${MEDIA_SAS_URL:-}" ]; then
		export RCLONE_CONFIG_AZ_SAS_URL="$MEDIA_SAS_URL"
	else
		export RCLONE_CONFIG_AZ_ACCOUNT="$MEDIA_ACCOUNT"
		export RCLONE_CONFIG_AZ_ENV_AUTH=true
	fi
}

backup_database() {
	: "${SQL_SERVER:?SQL_SERVER is required}"
	: "${DB_TARGET:?DB_TARGET is required}"

	local started stamp bacpac token
	started=$(date +%s)
	stamp=$(date -u +%Y-%m-%dT%H-%M-%SZ)
	bacpac="${WORK_DIR}/${SQL_DATABASE}-${ENV_NAME}-${stamp}.bacpac"

	# sqlpackage retries an unreachable server for over 10 minutes. Fail fast instead.
	timeout 15 bash -c "</dev/tcp/${SQL_SERVER}/1433" 2>/dev/null || die "cannot reach ${SQL_SERVER}:1433 (DNS, Private Link or firewall)"

	# The certificate is for *.database.windows.net, also when the server is addressed by its privatelink name.
	local cert_host="${SQL_SERVER/.privatelink./.}"
	local conn="Server=tcp:${SQL_SERVER},1433;Initial Catalog=${SQL_DATABASE};Encrypt=True;TrustServerCertificate=False;HostNameInCertificate=${cert_host};Connection Timeout=30"

	log "exporting ${SQL_DATABASE} on ${SQL_SERVER}"
	token=$(sql_token)
	# sqlpackage can hang forever on a dead connection.
	timeout --kill-after=30s "${EXPORT_TIMEOUT_SECONDS:-1800}" sqlpackage /Action:Export \
		/SourceConnectionString:"$conn" \
		/AccessToken:"$token" \
		/TargetFile:"$bacpac" \
		/Quiet:True >&2 || die "sqlpackage export failed or timed out (exit $?)"
	unset token

	local sha size object
	sha=$(sha256sum "$bacpac" | cut -d' ' -f1)
	size=$(stat -c %s "$bacpac")
	object="$(basename "$bacpac")"

	log "uploading ${object} ($(numfmt --to=iec "$size")) to ${DB_TARGET}"
	rclone copyto "$bacpac" "${DB_TARGET%/}/${object}" "${RCLONE_FLAGS[@]}" || die "upload of database backup failed"
	rm -f "$bacpac"

	jq -n \
		--arg env "$ENV_NAME" \
		--arg object "$object" \
		--arg createdAt "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
		--arg database "$SQL_DATABASE" \
		--arg server "$SQL_SERVER" \
		--arg sha "$sha" \
		--argjson size "$size" \
		--argjson seconds "$(($(date +%s) - started))" \
		'{env: $env, object: $object, createdAt: $createdAt, database: $database, server: $server,
		  bytes: $size, sha256: $sha, durationSeconds: $seconds}' |
		rclone rcat "${DB_TARGET%/}/latest.json" || die "could not write latest.json"

	log "database backup done: ${object}"
}

mirror_media() {
	: "${MEDIA_TARGET:?MEDIA_TARGET is required}"
	[ -n "${MEDIA_SAS_URL:-}" ] || : "${MEDIA_ACCOUNT:?MEDIA_ACCOUNT is required}"

	configure_media_remote
	local source="az:${MEDIA_CONTAINER}${MEDIA_SOURCE_PREFIX:+/${MEDIA_SOURCE_PREFIX}}"
	local keep=()
	if [ -n "${MEDIA_DELETED_TARGET:-}" ]; then
		keep=(--backup-dir "${MEDIA_DELETED_TARGET%/}/$(date -u +%Y-%m-%dT%H-%M-%SZ)")
	fi
	log "mirroring ${source#az:} to ${MEDIA_TARGET}"
	# --max-delete stops the run instead of emptying the mirror if the source ever looks empty.
	rclone sync "$source" "$MEDIA_TARGET" \
		--fast-list \
		--max-delete "$MEDIA_MAX_DELETE" \
		"${keep[@]}" \
		"${RCLONE_FLAGS[@]}" || die "media mirror failed"

	log "media mirror done"
}

cleanup() { rm -rf "$WORK_DIR"; }
trap cleanup EXIT
mkdir -p "$WORK_DIR"
chmod 700 "$WORK_DIR"

# Runs each part even if the other fails. Not `(step) || ...`: that disables errexit inside the step.
run_step() {
	local name="$1" status
	set +e
	(
		set -e
		"$name"
	)
	status=$?
	set -e
	[ "$status" -eq 0 ] || failed+=("$name")
}

log "starting backup for ${ENV_NAME}"
failed=()

if is_true "${SKIP_DB:-}"; then
	log "SKIP_DB=true, skipping database"
else
	run_step backup_database
fi

if is_true "${SKIP_MEDIA:-}"; then
	log "SKIP_MEDIA=true, skipping media"
else
	run_step mirror_media
fi

if [ ${#failed[@]} -gt 0 ]; then
	die "backup finished with failures: ${failed[*]}"
fi
log "backup finished successfully"
