#!/usr/bin/env bash
#
# Run on your own machine. Starts Umbraco on the copy of prod and the frontend in an info-fullstack-dev agent, with
# stack.sh, and forwards both to localhost, so they open in your browser, until Ctrl+C.
set -euo pipefail

usage() {
  cat >&2 <<EOF
usage: forward.sh [AGENT] [--no-up]

  AGENT     the agent, such as info-fullstack-dev-build; the only ready info-fullstack-dev agent when left out
  --no-up   only forward, without starting anything in the agent
EOF
  exit 1
}

die() { printf 'error: %s\n' "$*" >&2; exit 1; }

AGENT=""
UP=1
while [ $# -gt 0 ]; do
  case "$1" in
    --no-up) UP=0 ;;
    -h | --help | -*) usage ;;
    *) [ -z "$AGENT" ] || usage; AGENT="$1" ;;
  esac
  shift
done

if [ -z "$AGENT" ]; then
  ready="$(agentctl get agents | awk 'NR > 1 && $1 ~ /^info-fullstack-dev/ && $2 == "True" { print $1 }')"
  case "$(printf '%s' "$ready" | grep -c .)" in
    0) die "no info-fullstack-dev agent is ready. Start one as docs/agentctl.md, step 5, says." ;;
    1) AGENT="$ready" ;;
    *) die "several agents are ready, so name one: $(echo "$ready" | tr '\n' ' ')" ;;
  esac
fi

# The same ports as in the agent, since pages link to images on Umbraco's address, and the backoffice sends the
# browser back to its own.
for port in 4321 43450; do
  if (exec 3<>"/dev/tcp/127.0.0.1/$port") 2>/dev/null; then
    die "port $port is in use on this machine, perhaps by your own frontend or Umbraco. Stop it first."
  fi
done

if [ "$UP" = 1 ]; then
  echo "==> starting the stack in $AGENT, which takes a few minutes the first time"
  agentctl exec "$AGENT" -- bash -c '
    script=~/code/info.altinn.no/agents/fullstack-dev/scripts/stack.sh
    if [ ! -x "$script" ]; then
      echo "error: the agent'\''s checkout has no $script, since its branch, $(git -C ~/code/info.altinn.no branch --show-current), is older than the script. Check out one that has it:" >&2
      echo "  agentctl exec '"$AGENT"' -- git -C /home/agent/code/info.altinn.no checkout <branch>" >&2
      exit 1
    fi
    "$script" up'
fi

cat <<EOF

==> forwarding from $AGENT until Ctrl+C. Open:
  frontend   http://localhost:4321
  Umbraco    http://localhost:43450/umbraco, as a prod backoffice user: scripts/db/README.md names one

EOF
exec agentctl port-forward "$AGENT" 4321:4321 43450:43450
