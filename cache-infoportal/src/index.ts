import { isFallbackOn, isFallbackPreview, type FallbackSwitchEnv } from "./fallback-switch";

interface WorkerEnv extends FallbackSwitchEnv {
	ASTRO_INFOPORTAL: any
}

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);

		// API, UI and health checks always go to origin, also in fallback mode, so /health reports the real state.
		const excludedPathNames= ["/api/", "/ui/", "/health"];

		try {
			for (const excludedPathName of excludedPathNames) {
				if (url.pathname.startsWith(excludedPathName)) {
					return await env.ASTRO_INFOPORTAL.fetch(request);
				}
			}
		} catch (error) {
			throw new Error(`Failed to fetch API request from origin: ${error}`);
		}

		// Preview of fallback mode for this request only (see snapshot-infoportal/FALLBACK.md). Skips the edge cache,
		// so what you see really comes from the snapshot.
		if (isFallbackPreview(request, env)) {
			return env.SNAPSHOT_INFOPORTAL!.fetch(request);
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
			response = await cache.match(cacheKey);
		} catch (error) {
			throw new Error(`Failed to check cache match: ${error}`);
		}

		// Cached pages are served as usual, also in fallback mode: they are at least as fresh as the snapshot.
		// Only when the cache cannot answer (miss, or a cached 4xx such as a 404 from an Umbraco timeout) does
		// fallback mode decide where the request goes.
		if (!response || response.status >= 400) {
			if (await isFallbackOn(env)) {
				return env.SNAPSHOT_INFOPORTAL!.fetch(request);
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
