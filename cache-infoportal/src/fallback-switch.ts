/**
 * Decides per request whether fallback mode is active (issue #905, option B). The fallback itself is served by
 * snapshot-infoportal (src/fallback.ts there), reached through the SNAPSHOT_INFOPORTAL service binding.
 * Runbook: snapshot-infoportal/FALLBACK.md.
 *
 * Kept small on purpose, since it runs on every request:
 * - environments without SNAPSHOT_INFOPORTAL and FALLBACK_KV return false at once
 * - fallback:mode is read from KV at most every 15 seconds per isolate
 */
export type FallbackSwitchEnv = {
	SNAPSHOT_INFOPORTAL?: Fetcher;
	FALLBACK_KV?: KVNamespace;
	FALLBACK_PREVIEW_TOKEN?: string;
};

/** A request with this header and the FALLBACK_PREVIEW_TOKEN value is served in fallback mode, for testing. */
export const PREVIEW_HEADER = "x-infoportal-fallback";
const FALLBACK_MODE_KEY = "fallback:mode";
const MEMO_TTL_MS = 15_000;

let memo: { on: boolean; expires: number } | undefined;

/** For tests: forget the value cached in this isolate. */
export function resetFallbackSwitch(): void {
	memo = undefined;
}

export async function isFallbackActive(request: Request, env: FallbackSwitchEnv, now = Date.now()): Promise<boolean> {
	if (!env.SNAPSHOT_INFOPORTAL || !env.FALLBACK_KV) return false;

	const token = env.FALLBACK_PREVIEW_TOKEN;
	if (token && request.headers.get(PREVIEW_HEADER) === token) return true;

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
