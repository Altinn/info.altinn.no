#!/usr/bin/env bash
set -uo pipefail

TESTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=../lib.sh
. "$TESTS_DIR/../lib.sh"

PASS=0
FAIL=0

assert_eq() {
  local expected="$1" actual="$2" label="$3"
  if [ "$expected" = "$actual" ]; then
    PASS=$((PASS + 1)); printf 'ok   %s\n' "$label"
  else
    FAIL=$((FAIL + 1)); printf 'FAIL %s\n  expected: %s\n  actual:   %s\n' "$label" "$expected" "$actual"
  fi
}

assert_fails() {
  local label="$2"
  if ( eval "$1" ) >/dev/null 2>&1; then
    FAIL=$((FAIL + 1)); printf 'FAIL %s (expected non-zero exit)\n' "$label"
  else
    PASS=$((PASS + 1)); printf 'ok   %s\n' "$label"
  fi
}

assert_succeeds() {
  local label="$2"
  if ( eval "$1" ) >/dev/null 2>&1; then
    PASS=$((PASS + 1)); printf 'ok   %s\n' "$label"
  else
    FAIL=$((FAIL + 1)); printf 'FAIL %s (expected zero exit)\n' "$label"
  fi
}

FIXTURE="$(mktemp)"
cat >"$FIXTURE" <<'EOF'
# env   host                          catalog
at22    at22.example.invalid          umbraco
#at23   at23.example.invalid          umbraco
EOF

assert_eq "at22.example.invalid umbraco" "$(resolve_environment at22 "$FIXTURE")" "resolve_environment returns host and catalog"
assert_eq "at22" "$(list_environments "$FIXTURE" | tr -d ' ')" "list_environments omits commented entries"
assert_fails "resolve_environment at23 '$FIXTURE'" "commented environment is not resolvable"
assert_fails "resolve_environment nope '$FIXTURE'" "unknown environment exits non-zero"

rm -f "$FIXTURE"

assert_succeeds "assert_local_target localhost" "localhost allowed"
assert_succeeds "assert_local_target 127.0.0.1" "127.0.0.1 allowed"
assert_succeeds "assert_local_target 'localhost,1433'" "host with port allowed"

assert_fails "assert_local_target infop-at22-vllfov-server.privatelink.database.windows.net" "azure sql host rejected"
assert_fails "assert_local_target 'infop-prod-hxhapc-server.privatelink.database.windows.net,1433'" "azure sql host with port rejected"
assert_fails "assert_local_target 10.0.0.5" "arbitrary remote host rejected"
assert_fails "assert_local_target ''" "empty host rejected"

# tcp_check must fail fast against a port nothing listens on, and must not
# depend on timeout(1), which macOS does not ship.
START="$(date +%s)"
assert_fails "tcp_check 127.0.0.1 9 2" "tcp_check fails on a closed port"
ELAPSED=$(( $(date +%s) - START ))
if [ "$ELAPSED" -le 6 ]; then
  PASS=$((PASS+1)); printf 'ok   tcp_check respects its timeout (%ss)\n' "$ELAPSED"
else
  FAIL=$((FAIL+1)); printf 'FAIL tcp_check took %ss\n' "$ELAPSED"
fi

printf '\n%d passed, %d failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
