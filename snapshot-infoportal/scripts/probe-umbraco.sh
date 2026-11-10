#!/usr/bin/env bash
# Measures Umbraco response time while a snapshot run is going on.
#
# Calls the Delivery API directly (not through Cloudflare, so no cache) every few seconds with a small, valid query,
# and prints one line per call. Start it a few minutes before the run to get a baseline, and stop it with Ctrl+C
# a few minutes after. A summary (median, p95, max, errors) is printed on exit.
#
#   ./scripts/probe-umbraco.sh                       # at22, every 5 seconds
#   ./scripts/probe-umbraco.sh https://<host> 10     # other host, every 10 seconds
#   ./scripts/probe-umbraco.sh | tee probe.log       # also keep the output
set -uo pipefail

HOST="${1:-https://infoportal.at22.dis-core.altinn.cloud}"
INTERVAL="${2:-5}"
URL="$HOST/umbraco/delivery/api/v2/content?take=1&filter=contentType:startPage"

times=()
errors=0

summary() {
	echo
	if [ "${#times[@]}" -eq 0 ]; then
		echo "No successful calls."
	else
		printf '%s\n' "${times[@]}" | sort -n | awk -v errors="$errors" '
			{ v[NR] = $1 }
			END {
				p95 = v[int(NR * 0.95 + 0.5) > 0 ? int(NR * 0.95 + 0.5) : 1]
				printf "calls=%d errors=%d median=%.0fms p95=%.0fms max=%.0fms\n", NR, errors, v[int((NR + 1) / 2)], p95, v[NR]
			}'
	fi
	exit 0
}
trap summary INT TERM

echo "time      status  ms     ($URL)"
while true; do
	result=$(curl -s -o /dev/null -m 30 -H 'Accept-Language: nb' -w '%{http_code} %{time_total}' "$URL")
	status="${result%% *}"
	ms=$(awk -v t="${result##* }" 'BEGIN { printf "%.0f", t * 1000 }')
	if [ "$status" = "200" ]; then
		times+=("$ms")
	else
		errors=$((errors + 1))
	fi
	printf '%s  %s     %s\n' "$(date +%H:%M:%S)" "$status" "$ms"
	sleep "$INTERVAL"
done
