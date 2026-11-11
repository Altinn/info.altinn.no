/**
 * Decides per request whether fallback mode is active (issue #905, option B). The fallback itself is served by
 * snapshot-infoportal (src/fallback.ts there), reached through the SNAPSHOT_INFOPORTAL service binding.
 * Runbook: snapshot-infoportal/FALLBACK.md.
 *
 * Kept small on purpose:
 * - isFallbackPreview() is a header comparison, no I/O
 * - isFallbackOn() is only called when the edge cache cannot answer, and reads KV at most every 15 seconds per isolate
 * - environments without SNAPSHOT_INFOPORTAL and FALLBACK_KV return false at once
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

/** True when the request asks for fallback mode with the right preview token (for testing a single request). */
export function isFallbackPreview(request: Request, env: FallbackSwitchEnv): boolean {
	const token = env.FALLBACK_PREVIEW_TOKEN;
	return !!env.SNAPSHOT_INFOPORTAL && !!token && request.headers.get(PREVIEW_HEADER) === token;
}

/** True when fallback:mode is "on" in KV (fallback for everyone). */
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
