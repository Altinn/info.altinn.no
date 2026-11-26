interface Env {
	ASTRO_INFOPORTAL: any
}

// "lookup" means the request failed while checking the cache, before it was a hit or a miss.
type CacheStatus = "hit" | "miss" | "bypass" | "lookup";

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

	state.cache = "lookup";
	try {
		response = await cache.match(cacheKey);
	} catch (error) {
		throw new Error(`Failed to check cache match: ${error}`);
	}

	state.cache = response ? "hit" : "miss";
	if (!response) {
		try {
			response = await env.ASTRO_INFOPORTAL.fetch(request);
		} catch (error) {
			throw new Error(`Failed to fetch GET-request from origin: ${error}`);
		}

		const status = response.status;
		try {
			ctx.waitUntil(
				cache.put(cacheKey, response.clone()).catch((error) => {
					// The Cache API rejects 206 by design. workerd resolves 304 puts without storing them, so 304 never gets
					// here today; it is excluded so the origin's many 304s cannot flood the logs if that changes.
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

// The status is sent before the body, so a body that fails part-way reaches the client as a truncated response and
// never throws in handle(). Reading the body through this stream is the only way to see that failure.
function logBodyFailure(response: Response, onError: (error: unknown) => void): Response {
	if (!response.body) {
		return response;
	}
	const reader = response.body.getReader();
	const body = new ReadableStream({
		async pull(controller) {
			let chunk: ReadableStreamReadResult<Uint8Array>;
			try {
				chunk = await reader.read();
			} catch (error) {
				onError(error);
				controller.error(error);
				return;
			}
			if (chunk.done) {
				controller.close();
			} else {
				controller.enqueue(chunk.value);
			}
		},
		// A client that disconnects cancels the stream; that is not a failure, so it is not logged.
		cancel(reason) {
			return reader.cancel(reason);
		},
	});
	return new Response(body, response);
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
		const { status } = response;
		if (status >= 500) {
			logFailure("request failed", request, state.cache, { status });
		}
		return logBodyFailure(response, (error) => {
			logFailure("response body failed", request, state.cache, { status, error });
		});
	}
} satisfies ExportedHandler<Env>;
