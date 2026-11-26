import { createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import { afterEach, beforeEach, describe, it, expect, vi, type MockInstance } from "vitest";
import worker from "../src/index";

// For now, you'll need to do something like this to get a correctly-typed
// `Request` to pass to `worker.fetch()`.
const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

// The Cache API is shared across tests, so every test uses its own path.
let pathCounter = 0;
const uniqueUrl = (path = "/side") => `https://info.altinn.no${path}-${++pathCounter}`;

function createOrigin(status = 200, extraHeaders: Record<string, string> = {}) {
	const fetch = vi.fn(
		async (_request: Request) =>
			new Response(status === 304 ? null : "from origin", {
				status,
				headers: { "Cache-Control": "public, max-age=60", ...extraHeaders },
			}),
	);
	return { fetch, env: { ASTRO_INFOPORTAL: { fetch } } };
}

async function callWorker(
	request: Request<unknown, IncomingRequestCfProperties>,
	env: { ASTRO_INFOPORTAL: { fetch: (request: Request) => Promise<Response> } },
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

describe("cache-infoportal failure logging", () => {
	let consoleError: MockInstance<typeof console.error>;

	beforeEach(() => {
		consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
	});

	afterEach(() => {
		consoleError.mockRestore();
	});

	const loggedEntries = () => consoleError.mock.calls.map((call) => call[0]);

	it("logs a 5xx from origin once, as a cache miss", async () => {
		const origin = createOrigin(500);
		const url = uniqueUrl();

		await callWorker(new IncomingRequest(url), origin.env);

		expect(loggedEntries()).toEqual([
			{ msg: "request failed", method: "GET", path: new URL(url).pathname, cache: "miss", status: 500 },
		]);
	});

	it("logs a 5xx served from cache as a cache hit", async () => {
		const match = vi.spyOn(caches.default, "match").mockResolvedValue(new Response("cached", { status: 502 }));
		const origin = createOrigin();
		const url = uniqueUrl();

		try {
			await callWorker(new IncomingRequest(url), origin.env);
		} finally {
			match.mockRestore();
		}

		expect(origin.fetch).not.toHaveBeenCalled();
		expect(loggedEntries()).toEqual([
			{ msg: "request failed", method: "GET", path: new URL(url).pathname, cache: "hit", status: 502 },
		]);
	});

	it("logs a 5xx on a path that bypasses the cache", async () => {
		const origin = createOrigin(503);
		const request = new IncomingRequest(uniqueUrl("/api/search"), { method: "POST", body: "x" });

		await callWorker(request, origin.env);

		expect(loggedEntries()).toEqual([
			expect.objectContaining({ method: "POST", cache: "bypass", status: 503 }),
		]);
	});

	it("logs the path without the query string", async () => {
		const origin = createOrigin(500);
		const url = `${uniqueUrl()}?token=secret`;

		await callWorker(new IncomingRequest(url), origin.env);

		expect(consoleError).toHaveBeenCalledTimes(1);
		expect(loggedEntries()[0].path).toBe(new URL(url).pathname);
		expect(JSON.stringify(loggedEntries())).not.toContain("secret");
	});

	it.each([200, 404])("logs nothing for a %i response", async (status) => {
		const origin = createOrigin(status);
		const url = uniqueUrl();

		await callWorker(new IncomingRequest(url), origin.env);
		await callWorker(new IncomingRequest(url), origin.env);
		await callWorker(new IncomingRequest(uniqueUrl("/api/x")), origin.env);

		expect(consoleError).not.toHaveBeenCalled();
	});

	it("logs an exception once, capped at 300 characters, and still rethrows it", async () => {
		const env = {
			ASTRO_INFOPORTAL: {
				fetch: vi.fn(async (): Promise<Response> => {
					throw new Error(`connection refused ${"x".repeat(1000)}`);
				}),
			},
		};
		const url = uniqueUrl();

		await expect(callWorker(new IncomingRequest(url), env)).rejects.toThrow(
			"Failed to fetch GET-request from origin: Error: connection refused",
		);

		expect(consoleError).toHaveBeenCalledTimes(1);
		const entry = loggedEntries()[0];
		expect(entry).toMatchObject({ msg: "request failed", method: "GET", path: new URL(url).pathname, cache: "miss" });
		expect(entry.error).toMatch(/^Failed to fetch GET-request from origin: Error: connection refused x+$/);
		expect(entry.error).toHaveLength(300);
	});

	it("logs a cache put that the Cache API rejects", async () => {
		const origin = createOrigin(200, { Vary: "*" });
		const url = uniqueUrl();

		const response = await callWorker(new IncomingRequest(url), origin.env);

		expect(await response.text()).toBe("from origin");
		expect(loggedEntries()).toEqual([
			{
				msg: "cache put failed",
				method: "GET",
				path: new URL(url).pathname,
				cache: "miss",
				status: 200,
				error: "Cannot cache response with 'Vary: *' header.",
			},
		]);
	});

	it.each([206, 304])("does not log the Cache API refusing a %i response", async (status) => {
		const origin = createOrigin(status, status === 206 ? { "Content-Range": "bytes 0-10/100" } : {});

		const response = await callWorker(new IncomingRequest(uniqueUrl()), origin.env);

		expect(response.status).toBe(status);
		expect(consoleError).not.toHaveBeenCalled();
	});
});
