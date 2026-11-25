#!/usr/bin/env bash
#
# Runs Umbraco on a local copy of an environment's database and the Astro frontend against it, inside the agent's sandbox, so both can be
# opened in a browser outside it through forward.sh. Each step is skipped when it is already done, so `up` can be run
# again at any time.
set -euo pipefail

usage() {
  cat >&2 <<EOF
usage: stack.sh up [--env ENV] [--import] | down [--db] | status

  up         start the database, Umbraco and the frontend, and wait until each answers
  --env ENV  the environment whose copy to use, one of: $(list_environments)
             The default is the one already imported, or prod when there is none.
  --import   import the newest .bacpac again, replacing the database and what was changed in it
  down       stop the frontend and Umbraco, and remove the .dev.vars that up wrote
  --db       also stop the database container, which keeps its data
  status     show what runs
EOF
  exit 1
}

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
CMS="$REPO/umbraco-infoportal"
WEB="$REPO/astro-infoportal"
DB_CONTAINER=infoportal-mssql
UMBRACO_ENV="$HOME/.config/infoportal-db/umbraco.env"
# Which environment's copy the database holds, and from which file, as "<env> <file>".
IMPORTED_FILE="$HOME/.config/infoportal-db/imported"
UMBRACO_PORT=43450
WEB_PORT=4321
UMBRACO_LOG=/tmp/umbraco.log
WEB_LOG=/tmp/astro.log
DEV_VARS_FILE="$WEB/.dev.vars"
DEV_VARS_LINE="UMBRACO_API_URL=http://localhost:$UMBRACO_PORT/"
DEV_VARS_MARKER="# Written by agents/fullstack-dev/scripts/stack.sh, which removes it on down."

# shellcheck source=../../../scripts/db/lib.sh
. "$REPO/scripts/db/lib.sh"

http_code() {
  curl -s -o /dev/null -m "${2:-5}" -w '%{http_code}' "$1" 2>/dev/null || true
}

listen_pid() {
  { ss -ltnpH "sport = :$1" 2>/dev/null | grep -o 'pid=[0-9]*' | head -1 | cut -d= -f2; } || true
}

# wait_for <url> <seconds> <name> <log> [pid]: until the URL answers 200, or fail with the end of the log.
wait_for() {
  local url="$1" deadline=$((SECONDS + $2)) name="$3" logfile="$4" pid="${5:-}"
  log "    waiting for $name at $url (up to $2 s)"
  until [ "$(http_code "$url" 30)" = 200 ]; do
    if [ -n "$pid" ] && ! kill -0 "$pid" 2>/dev/null; then
      tail -20 "$logfile" >&2
      die "$name exited. The whole log is in $logfile"
    fi
    if [ "$SECONDS" -ge "$deadline" ]; then
      tail -20 "$logfile" >&2
      die "$name did not answer in time. The whole log is in $logfile"
    fi
    sleep 3
  done
}

# stop_pid <pid>: also when it is suspended, as after Ctrl+Z, when it would ignore the TERM.
stop_pid() {
  local pid="$1"
  kill -CONT "$pid" 2>/dev/null || true
  kill "$pid" 2>/dev/null || true
  for _ in $(seq 1 20); do kill -0 "$pid" 2>/dev/null || return 0; sleep 0.5; done
  kill -9 "$pid" 2>/dev/null || true
}

db_state() {
  podman inspect -f '{{.State.Status}}' "$DB_CONTAINER" 2>/dev/null || echo missing
}

imported_env() {
  [ -f "$IMPORTED_FILE" ] && cut -d' ' -f1 "$IMPORTED_FILE" || true
}

db_up() {
  local state imported env bacpac
  state="$(db_state)"
  imported="$(imported_env)"
  if [ "$IMPORT" = 1 ] || [ "$state" = missing ] || [ ! -f "$UMBRACO_ENV" ]; then
    env="${ENV_NAME:-${imported:-prod}}"
    # shellcheck disable=SC2012
    bacpac="$(ls -t "$REPO/.bacpacs/$env-umbraco-"*.bacpac 2>/dev/null | head -1 || true)"
    [ -n "$bacpac" ] ||
      die "no copy of $env in $REPO/.bacpacs. docs/agentctl.md, step 6, says how to give the agent one."
    umbraco_down
    log "==> importing $(basename "$bacpac"), which takes a few minutes"
    rm -f "$IMPORTED_FILE"
    "$REPO/scripts/db/refresh-local-db.sh" "$env" --skip-export --env-out "$UMBRACO_ENV" >/dev/null
    echo "$env $(basename "$bacpac")" >"$IMPORTED_FILE"
    return
  fi
  if [ -n "$ENV_NAME" ] && [ "$ENV_NAME" != "$imported" ]; then
    if [ -n "$imported" ]; then
      die "the database is a copy of $imported. Add --import to replace it with the newest copy of $ENV_NAME."
    fi
    log "warning: which environment the database is a copy of is not recorded. Add --import to be sure it is $ENV_NAME."
  fi
  if [ "$state" != running ]; then
    log "==> starting the database"
    podman start "$DB_CONTAINER" >/dev/null
    # shellcheck source=/dev/null
    . "$INFOPORTAL_DB_ENV_FILE"
    local deadline=$((SECONDS + 120))
    until run_sqlcmd -S "localhost,$MSSQL_PORT" -U sa -P "$MSSQL_SA_PASSWORD" -C -Q "SELECT 1" >/dev/null 2>&1; do
      [ "$SECONDS" -lt "$deadline" ] || die "the database did not start. See: podman logs $DB_CONTAINER"
      sleep 2
    done
  else
    log "==> the database runs"
  fi
}

# Whether the running Umbraco accepts a backoffice sign-in over plain HTTP, which needs the two settings below.
umbraco_signin_works() {
  local pid
  pid="$(listen_pid "$UMBRACO_PORT")"
  [ -n "$pid" ] && tr '\0' '\n' <"/proc/$pid/environ" 2>/dev/null | grep -qx 'Umbraco__CMS__Global__UseHttps=false'
}

umbraco_up() {
  if [ "$(http_code "http://127.0.0.1:$UMBRACO_PORT/umbraco")" = 200 ] && umbraco_signin_works; then
    log "==> Umbraco runs"
    return
  fi
  umbraco_down
  log "==> starting Umbraco, which builds it first"
  (
    cd "$CMS"
    set -a
    # shellcheck source=/dev/null
    . "$UMBRACO_ENV"
    set +a
    # Development leaves UseHttps at Umbraco's default, true, so the backoffice sign-in refuses plain HTTP, and sends
    # the browser back to https://localhost:44391, which serves nothing here.
    export ASPNETCORE_ENVIRONMENT=Development \
      Umbraco__CMS__Global__UseHttps=false \
      Umbraco__CMS__Security__BackOfficeHost="http://localhost:$UMBRACO_PORT"
    setsid nohup dotnet run --urls "http://localhost:$UMBRACO_PORT" </dev/null >"$UMBRACO_LOG" 2>&1 &
    echo $! >/tmp/umbraco.pid
  )
  wait_for "http://127.0.0.1:$UMBRACO_PORT/umbraco" 600 Umbraco "$UMBRACO_LOG" "$(cat /tmp/umbraco.pid)"
}

umbraco_down() {
  local pid
  pid="$(listen_pid "$UMBRACO_PORT")"
  if [ -n "$pid" ]; then
    log "==> stopping Umbraco"
    stop_pid "$pid"
  fi
  if [ -f /tmp/umbraco.pid ]; then
    stop_pid "$(cat /tmp/umbraco.pid)"
    rm -f /tmp/umbraco.pid
  fi
}

# Points the frontend at the local Umbraco. Sets DEV_VARS_CHANGED when it wrote the file, so the frontend restarts.
DEV_VARS_CHANGED=0
dev_vars_up() {
  if [ -f "$DEV_VARS_FILE" ]; then
    grep -qxF "$DEV_VARS_LINE" "$DEV_VARS_FILE" ||
      die "$DEV_VARS_FILE points the frontend elsewhere. Move it aside, or add $DEV_VARS_LINE to it yourself."
    return
  fi
  printf '%s\n%s\n' "$DEV_VARS_MARKER" "$DEV_VARS_LINE" >"$DEV_VARS_FILE"
  DEV_VARS_CHANGED=1
}

dev_vars_down() {
  if [ -f "$DEV_VARS_FILE" ] && [ "$(head -1 "$DEV_VARS_FILE")" = "$DEV_VARS_MARKER" ]; then
    rm "$DEV_VARS_FILE"
  fi
}

web_up() {
  # 127.0.0.1, since that is where agentctl port-forward connects. Without --host, Astro listens on ::1 only.
  if [ "$DEV_VARS_CHANGED" = 0 ] && [ "$(http_code "http://127.0.0.1:$WEB_PORT/" 60)" = 200 ]; then
    log "==> the frontend runs"
    return
  fi
  web_down
  log "==> starting the frontend"
  (
    cd "$WEB"
    [ -d node_modules ] || pnpm install --frozen-lockfile >/dev/null
    setsid nohup pnpm dev --host 127.0.0.1 </dev/null >"$WEB_LOG" 2>&1 &
    echo $! >/tmp/astro.pid
  )
  # The first page takes a while: Vite prepares its dependencies, and the page waits on Umbraco.
  wait_for "http://127.0.0.1:$WEB_PORT/" 180 "the frontend" "$WEB_LOG" "$(cat /tmp/astro.pid)"
}

web_down() {
  local pid
  # Astro refuses to start while another of its dev servers runs, even one that is suspended.
  (cd "$WEB" && pnpm exec astro dev stop >/dev/null 2>&1) || true
  pid="$(listen_pid "$WEB_PORT")"
  if [ -n "$pid" ]; then
    log "==> stopping the frontend"
    stop_pid "$pid"
  fi
  if [ -f /tmp/astro.pid ]; then
    stop_pid "$(cat /tmp/astro.pid)"
    rm -f /tmp/astro.pid
  fi
}

status() {
  local signin=no copy="which copy is not recorded"
  umbraco_signin_works && signin=yes
  [ -f "$IMPORTED_FILE" ] && copy="a copy of $(sed 's/ /, from /' "$IMPORTED_FILE")"
  printf '%-12s %s, %s\n' database "$(db_state)" "$copy"
  printf '%-12s HTTP %s, sign-in over HTTP: %s\n' Umbraco "$(http_code "http://127.0.0.1:$UMBRACO_PORT/umbraco")" "$signin"
  printf '%-12s HTTP %s\n' frontend "$(http_code "http://127.0.0.1:$WEB_PORT/" 30)"
}

[ $# -ge 1 ] || usage
command="$1"
shift
IMPORT=0
DB_DOWN=0
ENV_NAME=""
while [ $# -gt 0 ]; do
  case "$1" in
    --import) IMPORT=1 ;;
    --db) DB_DOWN=1 ;;
    --env)
      [ $# -ge 2 ] || usage
      ENV_NAME="$2"
      case " $(list_environments)" in *" $ENV_NAME "*) ;; *) die "unknown environment '$ENV_NAME'. Use one of: $(list_environments)" ;; esac
      shift
      ;;
    *) usage ;;
  esac
  shift
done

case "$command" in
  up)
    db_up
    umbraco_up
    dev_vars_up
    web_up
    copy="$(imported_env)"
    copy="${copy:-an environment that is not recorded}"
    cat <<EOF

Running, on a copy of $copy. From your machine, run agents/fullstack-dev/scripts/forward.sh $(hostname), and open:
  frontend   http://localhost:$WEB_PORT
  Umbraco    http://localhost:$UMBRACO_PORT/umbraco, as a backoffice user of $copy: scripts/db/README.md names one for prod
Logs: $UMBRACO_LOG and $WEB_LOG
EOF
    ;;
  down)
    web_down
    dev_vars_down
    umbraco_down
    if [ "$DB_DOWN" = 1 ]; then
      log "==> stopping the database"
      podman stop "$DB_CONTAINER" >/dev/null
    fi
    ;;
  status) status ;;
  *) usage ;;
esac
