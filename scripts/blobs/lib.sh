#!/usr/bin/env bash
# Shared helpers for the local blob copy scripts.
# Sourced, not executed. Must have no side effects on source.

INFOPORTAL_BLOBS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFOPORTAL_REPO_ROOT="$(cd "$INFOPORTAL_BLOBS_DIR/../.." && pwd)"
INFOPORTAL_DEFAULT_CONF="$INFOPORTAL_BLOBS_DIR/environments.conf"

log() { printf '%s\n' "$*" >&2; }
die() { printf 'error: %s\n' "$*" >&2; exit 1; }

# list_environments [conf] -> "at22 tt02 "
list_environments() {
  local conf="${1:-$INFOPORTAL_DEFAULT_CONF}"
  awk 'substr($1,1,1) != "#" && NF = 2 { printf "%s ", $1 }' "$conf"
}

# resolve_environment <env> [conf] -> "<host>"
resolve_environment() {
  local env_name="$1"
  local conf="${2:-$INFOPORTAL_DEFAULT_CONF}"
  [ -f "$conf" ] || die "environment config not found: $conf"

  local result
  result="$(awk -v want="$env_name" '
    substr($1,1,1) != "#" && NF == 2 && $1 == want { print $2; found = 1; exit }
    END { exit !found }
  ' "$conf")" || die "unknown environment '$env_name'. Available: $(list_environments "$conf")"

  printf '%s\n' "$result"
}

get_blob_sas() {
  EXPIRY=`date -u -d "1 hour" '+%Y-%m-%dT%H:%MZ'`
  az storage container generate-sas --account-name $1 --name umbraco --permissions racwdl --expiry $EXPIRY --https-only --auth-mode login --as-user -o tsv
}

# get_blob_url <blob_account>
get_blob_url() {
  echo "https://$1.blob.core.windows.net/umbraco/media";
}

run_azcopy() {
  azcopy sync "$1" "$2" --recursive --delete-destination=true
}
