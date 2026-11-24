import { createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import { describe, it, expect, vi } from "vitest";
import worker from "../src/index";

// For now, you'll need to do something like this to get a correctly-typed
// `Request` to pass to `worker.fetch()`.
const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

// The Cache API is shared across tests, so every test uses its own path.
let pathCounter = 0;
const uniqueUrl = (path = "/side") => `https://info.altinn.no${path}-${++pathCounter}`;

function createOrigin() {
	const fetch = vi.fn(
		async (_request: Request) =>
			new Response("from origin", {
				headers: { "Cache-Control": "public, max-age=60" },
			}),
	);
	return { fetch, env: { ASTRO_INFOPORTAL: { fetch } } };
}

async function callWorker(
	request: Request<unknown, IncomingRequestCfProperties>,
	env: ReturnType<typeof createOrigin>["env"],
) {
	const ctx = createExecutionContext();
	const response = await worker.fetch(request, env, ctx);
	// Let the background cache.put() finish before the next request.
	await waitOnExecutionContext(ctx);
	return response;
}

describe("cache-infoportal worker", () => {
	it("serves a cache miss from origin and repeat requests from cache", async () => {
		const origin = createOrigin();
		const url = uniqueUrl();

		const first = await callWorker(new IncomingRequest(url), origin.env);
		expect(await first.text()).toBe("from origin");

		const second = await callWorker(new IncomingRequest(url), origin.env);
		expect(await second.text()).toBe("from origin");

		expect(origin.fetch).toHaveBeenCalledTimes(1);
	});

	it("passes non-GET requests straight to origin without caching", async () => {
		const origin = createOrigin();
		const url = uniqueUrl();

		for (let i = 0; i < 2; i++) {
			const request = new IncomingRequest(url, { method: "POST", body: "data" });
			const response = await callWorker(request, origin.env);
			expect(await response.text()).toBe("from origin");
		}

		expect(origin.fetch).toHaveBeenCalledTimes(2);
		expect(origin.fetch.mock.calls[0][0].method).toBe("POST");
	});

	it.each(["/api/search", "/ui/component", "/health"])(
		"never caches excluded path %s",
		async (path) => {
			const origin = createOrigin();
			const url = uniqueUrl(path);

			await callWorker(new IncomingRequest(url), origin.env);
			await callWorker(new IncomingRequest(url), origin.env);

			expect(origin.fetch).toHaveBeenCalledTimes(2);
		},
	);

	it.each(["/api/subsidies/nb", "/api/schema/municipalities"])(
		"caches GET to static API data %s like pages",
		async (path) => {
			const origin = createOrigin();
			const url = `${uniqueUrl(path)}?path=%2Fx%2F&locale=nb`;

			await callWorker(new IncomingRequest(url), origin.env);
			await callWorker(new IncomingRequest(url), origin.env);

			expect(origin.fetch).toHaveBeenCalledTimes(1);
		},
	);

	it("does not cache server errors", async () => {
		const fetch = vi.fn(async () => new Response("error", { status: 502 }));
		const env = { ASTRO_INFOPORTAL: { fetch } };
		const url = uniqueUrl();

		await callWorker(new IncomingRequest(url), env);
		await callWorker(new IncomingRequest(url), env);

		expect(fetch).toHaveBeenCalledTimes(2);
	});

	describe("conditional requests", () => {
		const conditionalHeaders = {
			"If-None-Match": '"v1"',
			"If-Modified-Since": "Mon, 23 Nov 2026 08:00:00 GMT",
			"If-Match": '"v1"',
			"If-Unmodified-Since": "Mon, 23 Nov 2026 08:00:00 GMT",
			"If-Range": '"v1"',
			Range: "bytes=0-1",
		};

		function createConditionalOrigin() {
			const fetch = vi.fn(async (request: Request) => {
				const headers = { "Cache-Control": "public, max-age=60", ETag: '"v1"' };
				if (request.headers.get("If-None-Match") === '"v1"') {
					return new Response(null, { status: 304, headers });
				}
				if (request.headers.has("Range")) {
					return new Response("fr", { status: 206, headers: { ...headers, "Content-Range": "bytes 0-1/11" } });
				}
				return new Response("from origin", { headers });
			});
			return { fetch, env: { ASTRO_INFOPORTAL: { fetch } } };
		}

		it("fills the cache on a miss without passing conditional or range headers to origin", async () => {
			const origin = createConditionalOrigin();
			const url = uniqueUrl();

			const first = await callWorker(new IncomingRequest(url, { headers: conditionalHeaders }), origin.env);
			expect(first.status).toBe(200);
			expect(await first.text()).toBe("from origin");

			const sent = origin.fetch.mock.calls[0][0].headers;
			for (const name of Object.keys(conditionalHeaders)) {
				expect(sent.has(name), name).toBe(false);
			}

			const second = await callWorker(new IncomingRequest(url, { headers: { "If-None-Match": '"v1"' } }), origin.env);
			expect(second.status).toBe(304);
			expect(origin.fetch).toHaveBeenCalledTimes(1);
		});

		it("keeps other request headers when filling the cache", async () => {
			const origin = createConditionalOrigin();

			await callWorker(
				new IncomingRequest(uniqueUrl(), { headers: { "If-None-Match": '"v1"', "Accept-Language": "nn" } }),
				origin.env,
			);

			expect(origin.fetch.mock.calls[0][0].headers.get("Accept-Language")).toBe("nn");
		});

		it.each([304, 206])("passes a %i from origin on without caching it", async (status) => {
			const fetch = vi.fn(
				async () =>
					new Response(null, {
						status,
						headers: { "Cache-Control": "public, max-age=60", "Content-Range": "bytes 0-1/11" },
					}),
			);
			const env = { ASTRO_INFOPORTAL: { fetch } };
			const url = uniqueUrl();

			expect((await callWorker(new IncomingRequest(url), env)).status).toBe(status);
			expect((await callWorker(new IncomingRequest(url), env)).status).toBe(status);
			expect(fetch).toHaveBeenCalledTimes(2);
		});

		it("still caches 404s", async () => {
			const fetch = vi.fn(
				async () => new Response("not found", { status: 404, headers: { "Cache-Control": "public, max-age=60" } }),
			);
			const env = { ASTRO_INFOPORTAL: { fetch } };
			const url = uniqueUrl("/favicon.ico");

			expect((await callWorker(new IncomingRequest(url), env)).status).toBe(404);
			expect((await callWorker(new IncomingRequest(url), env)).status).toBe(404);
			expect(fetch).toHaveBeenCalledTimes(1);
		});

		it("passes conditional headers on unchanged for paths that are never cached", async () => {
			const origin = createConditionalOrigin();

			const response = await callWorker(
				new IncomingRequest(uniqueUrl("/api/search"), { headers: { "If-None-Match": '"v1"' } }),
				origin.env,
			);

			expect(response.status).toBe(304);
			expect(origin.fetch.mock.calls[0][0].headers.get("If-None-Match")).toBe('"v1"');
		});
	});

	it("wraps origin failures in a descriptive error", async () => {
		const env = {
			ASTRO_INFOPORTAL: {
				fetch: vi.fn(async () => {
					throw new Error("connection refused");
				}),
			},
		};

		await expect(
			callWorker(new IncomingRequest(uniqueUrl()), env),
		).rejects.toThrow("Failed to fetch GET-request from origin: Error: connection refused");
		await expect(
			callWorker(new IncomingRequest(uniqueUrl(), { method: "POST" }), env),
		).rejects.toThrow("Failed to fetch NON-GET-request from origin");
		await expect(
			callWorker(new IncomingRequest(uniqueUrl("/api/x")), env),
		).rejects.toThrow("Failed to fetch API request from origin");
	});
});
