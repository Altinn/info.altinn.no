interface Env {
	ASTRO_INFOPORTAL: any
}
export default {
	async fetch(request, env, ctx): Promise<Response> {
		try {
			if (request.method !== "GET") {
				return await env.ASTRO_INFOPORTAL.fetch(request);
			}
		} catch (error) {
			throw new Error(`Failed to fetch NON-GET-request from origin: ${error}`);
		}

		const url = new URL(request.url);

		try {
			if (url.search.startsWith("api")) {
				return await env.ASTRO_INFOPORTAL.fetch(request);
			}
		} catch (error) {
			throw new Error(`Failed to fetch API request from origin: ${error}`);
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
				ctx.waitUntil(cache.put(cacheKey, response.clone()));
			} catch (error) {
				throw new Error(`Failed to put response in cache: ${error}`);
			}
		}

		return response;
	}
} satisfies ExportedHandler<Env>;
