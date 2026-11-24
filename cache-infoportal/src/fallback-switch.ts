/**
 * Whether fallback mode is on (see snapshot-infoportal/FALLBACK.md). Reads KV at most every
 * 15 seconds per isolate. Environments without SNAPSHOT_INFOPORTAL and FALLBACK_KV are never in fallback mode.
 */
export type FallbackSwitchEnv = {
	SNAPSHOT_INFOPORTAL?: Fetcher;
	FALLBACK_KV?: KVNamespace;
};

const FALLBACK_MODE_KEY = "fallback:mode";
const MEMO_TTL_MS = 15_000;

let memo: { on: boolean; expires: number } | undefined;

/** For tests: forget the value cached in this isolate. */
export function resetFallbackSwitch(): void {
	memo = undefined;
}

/** True when fallback:mode is "on" in KV. */
export async function isFallbackOn(env: FallbackSwitchEnv, now = Date.now()): Promise<boolean> {
	if (!env.SNAPSHOT_INFOPORTAL || !env.FALLBACK_KV) return false;

	if (memo && memo.expires > now) return memo.on;
	let on = false;
	try {
		on = (await env.FALLBACK_KV.get(FALLBACK_MODE_KEY, { cacheTtl: 30 })) === "on";
	} catch (error) {
		// KV unavailable: keep normal behaviour rather than failing every request.
		console.error(`Could not read ${FALLBACK_MODE_KEY}: ${error}`);
	}
	memo = { on, expires: now + MEMO_TTL_MS };
	return on;
}
