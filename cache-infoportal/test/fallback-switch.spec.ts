import { createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import { env as testEnv } from "cloudflare:workers";
import { beforeEach, describe, expect, it, vi } from "vitest";
import worker from "../src/index";
import { resetFallbackSwitch } from "../src/fallback-switch";

const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;
const bindings = testEnv as unknown as { FALLBACK_KV: KVNamespace };

let pathCounter = 0;
const uniqueUrl = (path = "/side") => `https://info.altinn.no${path}-switch-${++pathCounter}`;

function createEnv() {
	const astro = vi.fn(async () => new Response("from astro", { headers: { "Cache-Control": "public, max-age=60" } }));
	const snapshot = vi.fn(
		async () => new Response("from snapshot", { headers: { "Cache-Control": "public, max-age=60, s-maxage=86400" } }),
	);
	const env = { ...bindings, ASTRO_INFOPORTAL: { fetch: astro }, SNAPSHOT_INFOPORTAL: { fetch: snapshot } as unknown as Fetcher };
	return { astro, snapshot, env };
}

async function call(url: string, env: ReturnType<typeof createEnv>["env"], init: RequestInit<IncomingRequestCfProperties> = {}) {
	const ctx = createExecutionContext();
	const response = await worker.fetch(new IncomingRequest(url, init), env, ctx);
	await waitOnExecutionContext(ctx);
	return response;
}

beforeEach(async () => {
	resetFallbackSwitch();
	await bindings.FALLBACK_KV.delete("fallback:mode");
});

describe("fallback switch", () => {
	it("uses astro and the cache when fallback:mode is not on", async () => {
		const { astro, snapshot, env } = createEnv();
		expect(await (await call(uniqueUrl(), env)).text()).toBe("from astro");
		expect(astro).toHaveBeenCalledTimes(1);
		expect(snapshot).not.toHaveBeenCalled();
	});

	it("sends everything to snapshot-infoportal when fallback:mode is on, also POST", async () => {
		await bindings.FALLBACK_KV.put("fallback:mode", "on");
		const { astro, snapshot, env } = createEnv();

		expect(await (await call(uniqueUrl(), env)).text()).toBe("from snapshot");
		expect(await (await call(uniqueUrl(), env, { method: "POST", body: "x" })).text()).toBe("from snapshot");
		expect(snapshot).toHaveBeenCalledTimes(2);
		expect(astro).not.toHaveBeenCalled();
	});

	it("keeps serving cached pages in fallback mode, and only uses the snapshot on a cache miss", async () => {
		const { astro, snapshot, env } = createEnv();
		const cached = uniqueUrl();
		await call(cached, env); // fills the cache from astro

		await bindings.FALLBACK_KV.put("fallback:mode", "on");
		resetFallbackSwitch();

		expect(await (await call(cached, env)).text()).toBe("from astro");
		expect(await (await call(uniqueUrl(), env)).text()).toBe("from snapshot");
		expect(astro).toHaveBeenCalledTimes(1);
		expect(snapshot).toHaveBeenCalledTimes(1);
	});

	it("uses the snapshot instead of a cached 404 in fallback mode", async () => {
		const astro = vi.fn(async () => new Response("not found", { status: 404, headers: { "Cache-Control": "public, max-age=60" } }));
		const { snapshot, env } = createEnv();
		const url = uniqueUrl();
		await call(url, { ...env, ASTRO_INFOPORTAL: { fetch: astro } }); // caches the 404

		await bindings.FALLBACK_KV.put("fallback:mode", "on");
		resetFallbackSwitch();

		expect(await (await call(url, env)).text()).toBe("from snapshot");
		expect(snapshot).toHaveBeenCalledTimes(1);
	});

	it("uses the snapshot instead of a cached 404 in fallback mode, also for an unsatisfiable range", async () => {
		const astro = vi.fn(async () => new Response("not found", { status: 404, headers: { "Cache-Control": "public, max-age=60" } }));
		const { snapshot, env } = createEnv();
		const url = uniqueUrl();
		await call(url, { ...env, ASTRO_INFOPORTAL: { fetch: astro } }); // caches the 404

		await bindings.FALLBACK_KV.put("fallback:mode", "on");
		resetFallbackSwitch();

		const response = await call(url, env, { headers: { Range: "bytes=999999-" } });
		expect(await response.text()).toBe("from snapshot");
		expect(snapshot).toHaveBeenCalledTimes(1);
	});

	it("lets the cache answer range and conditional requests for a cached page in fallback mode", async () => {
		const astro = vi.fn(
			async () => new Response("from astro", { headers: { "Cache-Control": "public, max-age=60", ETag: '"v1"' } }),
		);
		const { snapshot, env } = createEnv();
		const url = uniqueUrl();
		await call(url, { ...env, ASTRO_INFOPORTAL: { fetch: astro } }); // fills the cache from astro

		await bindings.FALLBACK_KV.put("fallback:mode", "on");
		resetFallbackSwitch();

		const partial = await call(url, env, { headers: { Range: "bytes=0-3" } });
		expect(partial.status).toBe(206);
		expect(await partial.text()).toBe("from");

		const notModified = await call(url, env, { headers: { "If-None-Match": '"v1"' } });
		expect(notModified.status).toBe(304);

		expect(snapshot).not.toHaveBeenCalled();
		expect(astro).toHaveBeenCalledTimes(1);
	});

	it("passes on the cache's 416 for an unsatisfiable range in fallback mode, and keeps the cached page", async () => {
		const { astro, snapshot, env } = createEnv();
		const url = uniqueUrl();
		await call(url, env); // fills the cache from astro

		await bindings.FALLBACK_KV.put("fallback:mode", "on");
		resetFallbackSwitch();

		const outOfRange = await call(url, env, { headers: { Range: "bytes=999999-" } });
		expect(outOfRange.status).toBe(416);
		expect(await (await call(url, env)).text()).toBe("from astro");
		expect(snapshot).not.toHaveBeenCalled();
		expect(astro).toHaveBeenCalledTimes(1);
	});

	it("caches snapshot responses, so repeat requests in fallback mode come from the edge cache", async () => {
		await bindings.FALLBACK_KV.put("fallback:mode", "on");
		const { astro, snapshot, env } = createEnv();
		const url = uniqueUrl();

		expect(await (await call(url, env)).text()).toBe("from snapshot");
		expect(await (await call(url, env)).text()).toBe("from snapshot");
		expect(snapshot).toHaveBeenCalledTimes(1);
		expect(astro).not.toHaveBeenCalled();
	});

	it("does not cache snapshot server errors", async () => {
		await bindings.FALLBACK_KV.put("fallback:mode", "on");
		const snapshot = vi.fn(async () => new Response("unavailable", { status: 503, headers: { "Cache-Control": "no-store" } }));
		const { env } = createEnv();
		const url = uniqueUrl();

		await call(url, { ...env, SNAPSHOT_INFOPORTAL: { fetch: snapshot } as unknown as Fetcher });
		await call(url, { ...env, SNAPSHOT_INFOPORTAL: { fetch: snapshot } as unknown as Fetcher });
		expect(snapshot).toHaveBeenCalledTimes(2);
	});

	it("still sends /health and /api/ to astro in fallback mode", async () => {
		await bindings.FALLBACK_KV.put("fallback:mode", "on");
		const { astro, snapshot, env } = createEnv();

		await call("https://info.altinn.no/health", env);
		await call("https://info.altinn.no/api/contactform/send", env, { method: "POST", body: "x" });
		expect(astro).toHaveBeenCalledTimes(2);
		expect(snapshot).not.toHaveBeenCalled();
	});

	it("serves static API data from the snapshot in fallback mode, but other /api/ calls from astro", async () => {
		await bindings.FALLBACK_KV.put("fallback:mode", "on");
		const { astro, snapshot, env } = createEnv();

		expect(await (await call(uniqueUrl("/api/subsidies/nb"), env)).text()).toBe("from snapshot");
		expect(await (await call(`${uniqueUrl("/api/schema/municipalities")}?path=%2Fx%2F&locale=nb`, env)).text()).toBe("from snapshot");
		expect(await (await call(uniqueUrl("/api/search"), env)).text()).toBe("from astro");
		expect(await (await call(uniqueUrl("/api/subsidies/nb"), env, { method: "POST", body: "x" })).text()).toBe("from astro");
		expect(snapshot).toHaveBeenCalledTimes(2);
		expect(astro).toHaveBeenCalledTimes(2);
	});

	it("is never active in environments without the bindings", async () => {
		await bindings.FALLBACK_KV.put("fallback:mode", "on");
		const astro = vi.fn(async () => new Response("from astro"));

		const response = await call(uniqueUrl(), { ASTRO_INFOPORTAL: { fetch: astro } } as never);
		expect(await response.text()).toBe("from astro");
	});
});
