import { isFallbackActive, serveFallback, type FallbackEnv } from "./fallback";

interface WorkerEnv extends FallbackEnv {
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

		// Fallback mode: serve from the R2 snapshot and never touch origin or the edge cache.
		if (await isFallbackActive(request, env)) {
			return serveFallback(request, env);
		}

		try {
			if (request.method !== "GET") {
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
