import { createExecutionContext, env as testEnv, waitOnExecutionContext } from "cloudflare:test";
import { beforeEach, describe, expect, it, vi } from "vitest";
import worker from "../src/index";
import { findRedirect, localeOf, PREVIEW_HEADER, redirectLocation, resetFallbackMemo, SNAPSHOT_HEADER } from "../src/fallback";
import { CURRENT_POINTER_KEY, FALLBACK_MODE_KEY, notFoundKey, objectKey, redirectsKey } from "../src/snapshot-keys";

const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;
const SITE = "https://info.altinn.no";
const ID = "2026-11-11T08-07-50-218Z";

type Bindings = { SNAPSHOTS: R2Bucket; MEDIA: R2Bucket; FALLBACK_KV: KVNamespace; FALLBACK_PREVIEW_TOKEN: string };
const bindings = testEnv as unknown as Bindings;

function createEnv() {
	const fetch = vi.fn(async () => new Response("from origin", { headers: { "content-type": "text/html" } }));
	return { fetch, env: { ...bindings, ASTRO_INFOPORTAL: { fetch } } };
}

async function call(path: string, init: RequestInit<IncomingRequestCfProperties> = {}, env = createEnv().env) {
	const ctx = createExecutionContext();
	const response = await worker.fetch(new IncomingRequest(`${SITE}${path}`, init), env, ctx);
	await waitOnExecutionContext(ctx);
	return response;
}

async function clearBucket(bucket: R2Bucket) {
	const listing = await bucket.list();
	if (listing.objects.length) await bucket.delete(listing.objects.map((o) => o.key));
}

async function seedSnapshot() {
	await bindings.FALLBACK_KV.put(CURRENT_POINTER_KEY, JSON.stringify({ id: ID, createdAt: "" }));
	const html = { httpMetadata: { contentType: "text/html; charset=utf-8" } };
	await bindings.SNAPSHOTS.put(objectKey(ID, "/"), "forside", html);
	await bindings.SNAPSHOTS.put(objectKey(ID, "/hjelp/"), "hjelp", html);
	await bindings.SNAPSHOTS.put(objectKey(ID, "/_astro/app.js"), "js", { httpMetadata: { contentType: "text/javascript" } });
	await bindings.SNAPSHOTS.put(notFoundKey(ID, "nb"), "fant ikke siden", html);
	await bindings.SNAPSHOTS.put(notFoundKey(ID, "en"), "page not found", html);
	await bindings.SNAPSHOTS.put(
		redirectsKey(ID),
		JSON.stringify({
			"/gammel/": "/hjelp/",
			"/en/help//": "/en/help/",
			"/EPiServer/CMS/Content/hjelp,,30126/": "/hjelp",
			"/ekstern/": "https://www.altinn.no/",
		}),
	);
	await bindings.MEDIA.put("media/abc/bilde.png", "png", { httpMetadata: { contentType: "image/png" } });
}

beforeEach(async () => {
	resetFallbackMemo();
	await clearBucket(bindings.SNAPSHOTS);
	await clearBucket(bindings.MEDIA);
	await bindings.FALLBACK_KV.delete(FALLBACK_MODE_KEY);
	await bindings.FALLBACK_KV.delete(CURRENT_POINTER_KEY);
	await seedSnapshot();
});

describe("fallback off", () => {
	it("serves from origin as before when fallback:mode is not on", async () => {
		const { fetch, env } = createEnv();
		const response = await call("/hjelp/", {}, env);
		expect(await response.text()).toBe("from origin");
		expect(fetch).toHaveBeenCalledTimes(1);
	});

	it("ignores a wrong preview token", async () => {
		const response = await call("/hjelp/", { headers: { [PREVIEW_HEADER]: "wrong" } });
		expect(await response.text()).toBe("from origin");
	});

	it("never turns on fallback in environments without the bindings", async () => {
		await bindings.FALLBACK_KV.put(FALLBACK_MODE_KEY, "on");
		const fetch = vi.fn(async () => new Response("from origin"));
		const response = await call("/hjelp/", {}, { ASTRO_INFOPORTAL: { fetch } } as never);
		expect(await response.text()).toBe("from origin");
	});
});

describe("fallback on", () => {
	beforeEach(async () => {
		await bindings.FALLBACK_KV.put(FALLBACK_MODE_KEY, "on");
	});

	it("serves pages from the snapshot without calling origin", async () => {
		const { fetch, env } = createEnv();
		const response = await call("/hjelp/?q=1", {}, env);

		expect(response.status).toBe(200);
		expect(await response.text()).toBe("hjelp");
		expect(response.headers.get("content-type")).toBe("text/html; charset=utf-8");
		expect(response.headers.get("cache-control")).toBe("no-store");
		expect(response.headers.get(SNAPSHOT_HEADER)).toBe(ID);
		expect(fetch).not.toHaveBeenCalled();
	});

	it("lets the browser keep static files for a short while", async () => {
		const response = await call("/_astro/app.js");
		expect(await response.text()).toBe("js");
		expect(response.headers.get("cache-control")).toBe("public, max-age=300");
	});

	it("answers HEAD without a body", async () => {
		const response = await call("/hjelp/", { method: "HEAD" });
		expect(response.status).toBe(200);
		expect(await response.text()).toBe("");
	});

	it("redirects like the live site, keeping the query string", async () => {
		const response = await call("/gammel/?a=1", { redirect: "manual" });
		expect(response.status).toBe(302);
		expect(response.headers.get("location")).toBe("/hjelp/?a=1");
	});

	it("adds the trailing slash to redirect targets from the old CMS", async () => {
		const response = await call("/EPiServer/CMS/Content/hjelp,,30126/");
		expect(response.headers.get("location")).toBe("/hjelp/");
	});

	it("redirects to other sites as-is", async () => {
		const response = await call("/ekstern/?a=1");
		expect(response.headers.get("location")).toBe("https://www.altinn.no/");
	});

	it("redirects a page path without trailing slash", async () => {
		const response = await call("/hjelp?x=1");
		expect(response.status).toBe(302);
		expect(response.headers.get("location")).toBe("/hjelp/?x=1");
	});

	it("serves the 404 page in the right language, falling back to nb", async () => {
		const en = await call("/en/finnes-ikke/");
		expect(en.status).toBe(404);
		expect(await en.text()).toBe("page not found");

		const nn = await call("/nn/finst-ikkje/");
		expect(nn.status).toBe(404);
		expect(await nn.text()).toBe("fant ikke siden");
	});

	it("serves media from the media bucket", async () => {
		const response = await call("/media/abc/bilde.png");
		expect(response.status).toBe(200);
		expect(new TextDecoder().decode(await response.arrayBuffer())).toBe("png");
	});

	it("answers form submissions with 503", async () => {
		const { fetch, env } = createEnv();
		const response = await call("/hjelp/skriv-til-oss/altinn/", { method: "POST", body: "x" }, env);
		expect(response.status).toBe(503);
		expect(response.headers.get("retry-after")).toBe("300");
		expect(fetch).not.toHaveBeenCalled();
	});

	it("still sends /health and /api/ to origin", async () => {
		const { fetch, env } = createEnv();
		await call("/health", {}, env);
		await call("/api/redirect?path=/", {}, env);
		expect(fetch).toHaveBeenCalledTimes(2);
	});

	it("answers 503 when there is no current snapshot", async () => {
		await bindings.FALLBACK_KV.delete(CURRENT_POINTER_KEY);
		const response = await call("/hjelp/");
		expect(response.status).toBe(503);
	});
});

describe("preview header", () => {
	it("turns on fallback for one request only", async () => {
		const { fetch, env } = createEnv();
		const preview = await call("/hjelp/", { headers: { [PREVIEW_HEADER]: "test-token" } }, env);
		expect(await preview.text()).toBe("hjelp");

		const normal = await call("/hjelp/", {}, env);
		expect(await normal.text()).toBe("from origin");
		expect(fetch).toHaveBeenCalledTimes(1);
	});
});

describe("helpers", () => {
	it("finds redirects stored with or without trailing or repeated slashes", () => {
		const redirects = { "/a/": "/x/", "/b": "/y/", "/en/help//": "/en/help/" };
		expect(findRedirect(redirects, "/a")).toBe("/x/");
		expect(findRedirect(redirects, "/b/")).toBe("/y/");
		expect(findRedirect(redirects, "/en/help//")).toBe("/en/help/");
		expect(findRedirect(redirects, "/c/")).toBeUndefined();
		expect(findRedirect(redirects, "/toString")).toBeUndefined();
	});

	it("builds redirect locations like Astro", () => {
		const url = new URL(`${SITE}/gammel/?q=1`);
		expect(redirectLocation("/ny/?old=1", url)).toBe("/ny/?q=1");
		expect(redirectLocation("/ny", url)).toBe("/ny/?q=1");
		expect(redirectLocation("/fil.pdf", url)).toBe("/fil.pdf?q=1");
		expect(redirectLocation(`${SITE}/ny/`, url)).toBe("/ny/?q=1");
	});

	it("finds the locale from the path", () => {
		expect(localeOf("/")).toBe("nb");
		expect(localeOf("/nn/hjelp/")).toBe("nn");
		expect(localeOf("/en")).toBe("en");
		expect(localeOf("/energi/")).toBe("nb");
	});
});
