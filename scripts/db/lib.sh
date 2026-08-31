#!/usr/bin/env bash
# Shared helpers for the local database copy scripts.
# Sourced, not executed. Must have no side effects on source.

INFOPORTAL_DB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFOPORTAL_REPO_ROOT="$(cd "$INFOPORTAL_DB_DIR/../.." && pwd)"
INFOPORTAL_DEFAULT_CONF="$INFOPORTAL_DB_DIR/environments.conf"

log() { printf '%s\n' "$*" >&2; }
die() { printf 'error: %s\n' "$*" >&2; exit 1; }

# list_environments [conf] -> "at22 tt02 "
list_environments() {
  local conf="${1:-$INFOPORTAL_DEFAULT_CONF}"
  awk 'substr($1,1,1) != "#" && NF >= 3 { printf "%s ", $1 }' "$conf"
}

# resolve_environment <env> [conf] -> "<host> <catalog>"
resolve_environment() {
  local env_name="$1"
  local conf="${2:-$INFOPORTAL_DEFAULT_CONF}"
  [ -f "$conf" ] || die "environment config not found: $conf"

  local result
  result="$(awk -v want="$env_name" '
    substr($1,1,1) != "#" && NF >= 3 && $1 == want { print $2, $3; found = 1; exit }
    END { exit !found }
  ' "$conf")" || die "unknown environment '$env_name'. Available: $(list_environments "$conf")"

  printf '%s\n' "$result"
}

# assert_local_target <host[,port]>
#
# Hard guard: import and any other write action must never reach a remote server.
# This exits rather than prompting — a mistyped argument must be incapable of
# writing to Azure. Do not soften this into a confirmation.
assert_local_target() {
  local raw="${1:-}"
  local host="${raw%%,*}"

  [ -n "$host" ] || die "no target host given; refusing to continue"

  case "$host" in
    *database.windows.net*)
      die "refusing to target Azure SQL host '$host'. Remote environments are read-only; this action only writes to a local container."
      ;;
  esac

  case "$host" in
    localhost|127.0.0.1|::1|'[::1]') return 0 ;;
    *)
      die "refusing to target non-local host '$host'. Allowed targets: localhost, 127.0.0.1, ::1."
      ;;
  esac
}

# find_sqlpackage -> path on stdout
# `dotnet tool install -g` does not put ~/.dotnet/tools on PATH, so check there too.
find_sqlpackage() {
  if command -v sqlpackage >/dev/null 2>&1; then
    command -v sqlpackage
    return 0
  fi
  if [ -x "$HOME/.dotnet/tools/sqlpackage" ]; then
    printf '%s\n' "$HOME/.dotnet/tools/sqlpackage"
    return 0
  fi
  return 1
}

require_sqlpackage() {
  find_sqlpackage >/dev/null 2>&1 || die "sqlpackage not found. Install it with:
  dotnet tool install -g microsoft.sqlpackage
and ensure \$HOME/.dotnet/tools is on your PATH."
}

require_sqlcmd() {
  command -v sqlcmd >/dev/null 2>&1 || die "sqlcmd not found. Install it with:
  brew install sqlcmd        # macOS
  sudo apt-get install mssql-tools18   # Debian/Ubuntu"
}

# run_sqlcmd <args...>
# GODEBUG is mandatory: Azure SQL Edge presents a certificate with a negative
# serial number, which Go's x509 parser rejects outright. -C does not help
# because parsing fails before trust is evaluated.
run_sqlcmd() {
  GODEBUG=x509negativeserial=1 sqlcmd "$@"
}

# container_cli -> "docker" | "podman"
container_cli() {
  if [ -n "${CONTAINER_CLI:-}" ]; then printf '%s\n' "$CONTAINER_CLI"; return 0; fi

  # Prefer a real docker over the podman-docker shim. On macOS `docker` is
  # commonly a symlink to podman, and podman invoked under that name reports
  # itself as docker -- so resolve every `docker` on PATH and pick the first
  # that does NOT accept podman's --connection flag. Never trust the name.
  local candidate
  candidate="$(IFS=:
    for dir in $PATH; do
      [ -x "$dir/docker" ] || continue
      if ! "$dir/docker" --help 2>&1 | grep -q -- '--connection'; then
        printf '%s\n' "$dir/docker"
        break
      fi
    done)"
  if [ -n "$candidate" ]; then printf '%s\n' "$candidate"; return 0; fi

  if command -v docker >/dev/null 2>&1; then printf 'docker\n'; return 0; fi
  if command -v podman >/dev/null 2>&1; then printf 'podman\n'; return 0; fi
  return 1
}

# container_is_podman -> exit 0 if the detected CLI is podman.
# Do not grep --version: podman adopts a docker-compat personality when
# invoked through a `docker` symlink (podman-mac-helper) and reports
# "docker version X". Test for the flag we actually need instead — docker
# has no --connection global flag.
container_is_podman() {
  local cli
  cli="$(container_cli)" || return 1
  "$cli" --help 2>&1 | grep -q -- '--connection'
}

# cre <args...> - container runtime exec, with the podman connection pinned.
#
# The active podman connection is global user state that any other project can
# change, and only one podman machine runs at a time. Pinning prevents the
# database landing in an unrelated project's VM.
cre() {
  local cli
  cli="$(container_cli)" || die "no container runtime found. Install docker or podman."

  if container_is_podman; then
    if command -v podman >/dev/null 2>&1; then cli=podman; fi
    "$cli" --connection "${INFOPORTAL_PODMAN_CONNECTION:-infoportal-db}" "$@"
  else
    "$cli" "$@"
  fi
}

# compose <args...> - run compose against the detected runtime.
#
# Not every CLI ships the compose plugin: Homebrew's `docker` formula is the
# bare client, so `docker compose` is an unknown command there. Fall back to a
# standalone docker-compose binary, pointed at the same daemon via the CLI's
# current context, so a developer does not have to install a plugin by hand.
compose() {
  local cli
  cli="$(container_cli)" || die "no container runtime found. Install docker or podman."

  if "$cli" compose version >/dev/null 2>&1; then
    cre compose "$@"
    return
  fi

  if command -v docker-compose >/dev/null 2>&1; then
    local host
    host="$("$cli" context inspect --format '{{.Endpoints.docker.Host}}' 2>/dev/null || true)"
    if [ -n "$host" ]; then
      DOCKER_HOST="$host" docker-compose "$@"
    else
      docker-compose "$@"
    fi
    return
  fi

  die "no compose implementation found for '$cli'.

Install one of:
  brew install docker-compose        # standalone binary, picked up automatically
  (podman ships 'podman compose' already)"
}

# require_container_connection - verify the pinned podman connection exists.
#
# Deliberately NOT inside cre(). die() calls exit, and cre()'s call sites wrap it
# in command substitutions with `2>/dev/null` and `|| true` fallbacks — which
# discard the message and skip the fallbacks, so the script would abort with no
# output at all for exactly the misconfigured user this check exists to help.
# Call this explicitly, early, and unredirected.
require_container_connection() {
  container_is_podman || return 0

  local cli conn
  cli="$(container_cli)" || die "no container runtime found. Install docker or podman."
  if command -v podman >/dev/null 2>&1; then cli=podman; fi
  conn="${INFOPORTAL_PODMAN_CONNECTION:-infoportal-db}"

  "$cli" system connection list --format '{{.Name}}' 2>/dev/null | grep -qx "$conn" && return 0

  die "podman connection '$conn' not found.

This tooling pins its connection so the database cannot land in another
project's VM. Create the machine, or point at an existing one with
INFOPORTAL_PODMAN_CONNECTION=<name>.

Only one podman machine runs at a time. To switch:
  podman machine stop <currently-running>
  podman machine start $conn"
}

# tcp_check <host> <port> [timeout_seconds]
#
# Deliberately avoids timeout(1), which macOS does not ship. Runs the connect
# in a subshell and reaps it with a watchdog loop.
tcp_check() {
  local host="$1" port="$2" timeout="${3:-5}" waited=0 pid

  ( exec 3<>"/dev/tcp/$host/$port" ) 2>/dev/null &
  pid=$!

  while kill -0 "$pid" 2>/dev/null; do
    if [ "$waited" -ge "$timeout" ]; then
      kill "$pid" 2>/dev/null
      wait "$pid" 2>/dev/null
      return 1
    fi
    sleep 1
    waited=$((waited + 1))
  done

  wait "$pid"
}

# resolve_host_ipv4 <host> -> prints an IPv4 address
#
# bash 3.2 (Apple's build) resolves /dev/tcp hostnames with gethostbyname, which
# ignores the split-horizon DNS a VPN installs on macOS. Private Link names then
# fail to resolve inside /dev/tcp even though dscacheutil, sqlcmd and sqlpackage
# all resolve them fine via getaddrinfo. So resolve with a system resolver first
# and connect to the address, never to the name.
resolve_host_ipv4() {
  local host="$1" ip=""

  if command -v getent >/dev/null 2>&1; then
    ip="$(getent ahostsv4 "$host" 2>/dev/null | awk '/STREAM/ { print $1; exit }')"
    [ -n "$ip" ] || ip="$(getent hosts "$host" 2>/dev/null | awk '{ print $1; exit }')"
  fi
  if [ -z "$ip" ] && command -v dscacheutil >/dev/null 2>&1; then
    ip="$(dscacheutil -q host -a name "$host" 2>/dev/null | awk '/^ip_address:/ { print $2; exit }')"
  fi
  if [ -z "$ip" ] && command -v dig >/dev/null 2>&1; then
    ip="$(dig +short A "$host" 2>/dev/null | awk '/^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$/ { print; exit }')"
  fi
  if [ -z "$ip" ] && command -v host >/dev/null 2>&1; then
    ip="$(host -t A "$host" 2>/dev/null | awk '/has address/ { print $NF; exit }')"
  fi

  [ -n "$ip" ] || return 1
  printf '%s\n' "$ip"
}

# require_remote_reachable <host> <port>
#
# Splits the two failure modes the old single check could not tell apart:
# a DNS failure and a routing failure now produce different messages.
require_remote_reachable() {
  local host="$1" port="$2" ip

  if ! ip="$(resolve_host_ipv4 "$host")"; then
    die "cannot resolve $host.

This is a Private Link address, so it only resolves over the VPN.
  1. Connect to the VPN.
  2. If you are connected, your VPN's DNS is not serving the privatelink zone."
  fi

  tcp_check "$ip" "$port" 8 && return 0

  die "$host resolves to $ip, but $ip:$port is not reachable.

DNS is working, so this is routing or access rather than the VPN being down:
  1. The VPN may not route this subnet.
  2. Your account may not have been granted access to this database.

Check with:
  sqlcmd -S $host -d umbraco -C -U <your-entra-email> -P <password>"
}
