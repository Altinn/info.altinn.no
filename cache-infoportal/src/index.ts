import { isFallbackOn, type FallbackSwitchEnv } from "./fallback-switch";

interface WorkerEnv extends FallbackSwitchEnv {
	ASTRO_INFOPORTAL: any
}

// API, UI and health checks always go to origin, also in fallback mode, so /health reports the real state.
const excludedPathNames = ["/api/", "/ui/", "/health"];

// Exception: GET to /api/ endpoints with static Umbraco data goes through the cache like pages, so they work in
// fallback mode (the snapshot stores them). Keep in sync with SNAPSHOT_API_PREFIXES in snapshot-infoportal/src/keys.ts.
const cachedApiPathNames = ["/api/subsidies/", "/api/schema/municipalities"];

// cache.match() applies these to the stored entry itself and answers 206, 304, 412 or 416, so a lookup with them
// does not show what is stored.
const conditionalHeaderNames = ["if-none-match", "if-modified-since", "if-match", "if-unmodified-since", "if-range", "range"];

function withoutConditionalHeaders(request: Request): Request {
	const headers = new Headers(request.headers);
	for (const name of conditionalHeaderNames) {
		headers.delete(name);
	}
	return new Request(request, { headers });
}

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);

		const isCachedApi =
			request.method === "GET" && cachedApiPathNames.some((pathName) => url.pathname.startsWith(pathName));

		try {
			if (!isCachedApi && excludedPathNames.some((pathName) => url.pathname.startsWith(pathName))) {
				return await env.ASTRO_INFOPORTAL.fetch(request);
			}
		} catch (error) {
			throw new Error(`Failed to fetch API request from origin: ${error}`);
		}

		try {
			if (request.method !== "GET") {
				// In fallback mode, posts are answered by snapshot-infoportal (503) instead of a failing origin.
				if (await isFallbackOn(env)) return env.SNAPSHOT_INFOPORTAL!.fetch(request);
				return await env.ASTRO_INFOPORTAL.fetch(request);
			}
		} catch (error) {
			throw new Error(`Failed to fetch NON-GET-request from origin: ${error}`);
		}

		const cacheKey = new Request(url.toString(), {
			headers: request.headers,
			method: "GET",
		});

		const cache = caches.default;
		let response;

		try {
			response = await cache.match(withoutConditionalHeaders(cacheKey));
		} catch (error) {
			throw new Error(`Failed to check cache match: ${error}`);
		}

		// Cached pages are served as usual, also in fallback mode: they are at least as fresh as the snapshot.
		// Only on a miss, or a cached 4xx such as a 404 from an Umbraco timeout, does fallback mode decide where
		// the request goes.
		if (!response || response.status >= 400) {
			if (await isFallbackOn(env)) {
				// Snapshot responses are cached like responses from Astro, so repeat requests are served from the
				// edge cache. When fallback mode is turned off, the cache must be purged (see snapshot-infoportal/FALLBACK.md).
				const fallback = await env.SNAPSHOT_INFOPORTAL!.fetch(request);
				if (fallback.status < 500) {
					ctx.waitUntil(cache.put(cacheKey, fallback.clone()));
				}
				return fallback;
			}
		}

		if (response && conditionalHeaderNames.some((name) => request.headers.has(name))) {
			try {
				response = (await cache.match(cacheKey)) ?? response;
			} catch (error) {
				throw new Error(`Failed to check cache match: ${error}`);
			}
		}

		if (!response) {
			try {
				response = await env.ASTRO_INFOPORTAL.fetch(request);
			} catch (error) {
				throw new Error(`Failed to fetch GET-request from origin: ${error}`);
			}

			try {
				// Server errors are not cached, so a short outage does not leave error pages in the cache
				// after origin has recovered.
				if (response.status < 500) {
					ctx.waitUntil(cache.put(cacheKey, response.clone()));
				}
			} catch (error) {
				throw new Error(`Failed to put response in cache: ${error}`);
			}
		}

		return response;
	}
} satisfies ExportedHandler<WorkerEnv>;
