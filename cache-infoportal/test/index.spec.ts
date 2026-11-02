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
