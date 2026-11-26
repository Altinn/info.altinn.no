interface Env {
	ASTRO_INFOPORTAL: any
}

type CacheStatus = "hit" | "miss" | "bypass";

const MAX_ERROR_LENGTH = 300;

// Invocation logs are off (wrangler.jsonc), so these lines are the only per-request trace of a failure.
function logFailure(
	msg: string,
	request: Request,
	cache: CacheStatus,
	details: { status?: number; error?: unknown },
) {
	const entry: Record<string, unknown> = {
		msg,
		method: request.method,
		path: new URL(request.url).pathname,
		cache,
	};
	if (details.status !== undefined) {
		entry.status = details.status;
	}
	if (details.error !== undefined) {
		const error = details.error;
		entry.error = (error instanceof Error ? error.message : String(error)).slice(0, MAX_ERROR_LENGTH);
	}
	console.error(entry);
}

async function handle(request: Request, env: Env, ctx: ExecutionContext, state: { cache: CacheStatus }): Promise<Response> {
	try {
		if (request.method !== "GET") {
			return await env.ASTRO_INFOPORTAL.fetch(request);
		}
	} catch (error) {
		throw new Error(`Failed to fetch NON-GET-request from origin: ${error}`);
	}

	const url = new URL(request.url);

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

	const cacheKey = new Request(url.toString(), {
		headers: request.headers,
		method: "GET",
	});

	const cache = caches.default;
	let response;

	state.cache = "miss";
	try {
		response = await cache.match(cacheKey);
	} catch (error) {
		throw new Error(`Failed to check cache match: ${error}`);
	}

	if (response) {
		state.cache = "hit";
	} else {
		try {
			response = await env.ASTRO_INFOPORTAL.fetch(request);
		} catch (error) {
			throw new Error(`Failed to fetch GET-request from origin: ${error}`);
		}

		const status = response.status;
		try {
			ctx.waitUntil(
				cache.put(cacheKey, response.clone()).catch((error) => {
					// The Cache API rejects 206 and drops 304; origin sends many 304s, so logging them would flood the logs.
					if (status !== 206 && status !== 304) {
						logFailure("cache put failed", request, "miss", { status, error });
					}
				}),
			);
		} catch (error) {
			throw new Error(`Failed to put response in cache: ${error}`);
		}
	}

	return response;
}

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const state: { cache: CacheStatus } = { cache: "bypass" };
		let response: Response;
		try {
			response = await handle(request, env, ctx, state);
		} catch (error) {
			logFailure("request failed", request, state.cache, { error });
			throw error;
		}
		if (response.status >= 500) {
			logFailure("request failed", request, state.cache, { status: response.status });
		}
		return response;
	}
} satisfies ExportedHandler<Env>;
