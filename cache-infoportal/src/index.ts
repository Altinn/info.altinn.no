import { isFallbackOn, type FallbackSwitchEnv } from "./fallback-switch";

interface WorkerEnv extends FallbackSwitchEnv {
	ASTRO_INFOPORTAL: any
}

// API, UI and health checks always go to Astro, also in fallback mode, so /health reports the real state.
const astroOnlyPathNames = ["/api/", "/ui/", "/health"];

// Exception: GET to /api/ endpoints with static Umbraco data goes through the cache like pages, so they work in
// fallback mode (the snapshot stores them). Keep in sync with SNAPSHOT_API_PREFIXES in snapshot-infoportal/src/keys.ts.
const cachedApiPathNames = ["/api/subsidies/", "/api/schema/municipalities"];

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const cacheable = shouldCache(request);

		if (cacheable) {
			const cached = await getFromCache(request);
			// Cached pages are served also in fallback mode: they are at least as fresh as the snapshot. A cached 4xx,
			// such as a 404 from an Umbraco timeout, gives way to the snapshot.
			if (cached && (cached.status < 400 || !(await useSnapshot(request, env)))) {
				return cached;
			}
		}

		const response = (await useSnapshot(request, env)) ? await getFromSnapshot(request, env) : await getFromAstro(request, env);

		// Server errors are not cached, so a short outage does not leave error pages in the cache after origin has
		// recovered. Snapshot responses are cached too: when fallback mode is turned off, the cache must be purged
		// (see snapshot-infoportal/FALLBACK.md).
		if (cacheable && response.status < 500) {
			ctx.waitUntil(caches.default.put(cacheKey(request), response.clone()));
		}

		return response;
	},
} satisfies ExportedHandler<WorkerEnv>;

function isAstroOnly(request: Request): boolean {
	const { pathname } = new URL(request.url);
	const isCachedApi = request.method === "GET" && cachedApiPathNames.some((pathName) => pathname.startsWith(pathName));
	return !isCachedApi && astroOnlyPathNames.some((pathName) => pathname.startsWith(pathName));
}

function shouldCache(request: Request): boolean {
	return request.method === "GET" && !isAstroOnly(request);
}

async function useSnapshot(request: Request, env: WorkerEnv): Promise<boolean> {
	return !isAstroOnly(request) && (await isFallbackOn(env));
}

function cacheKey(request: Request): Request {
	return new Request(request.url, { headers: request.headers, method: "GET" });
}

async function getFromCache(request: Request): Promise<Response | undefined> {
	try {
		return await caches.default.match(cacheKey(request));
	} catch (error) {
		throw new Error(`Failed to check cache match: ${error}`);
	}
}

function getFromSnapshot(request: Request, env: WorkerEnv): Promise<Response> {
	return env.SNAPSHOT_INFOPORTAL!.fetch(request);
}

async function getFromAstro(request: Request, env: WorkerEnv): Promise<Response> {
	try {
		return await env.ASTRO_INFOPORTAL.fetch(request);
	} catch (error) {
		throw new Error(`Failed to fetch ${request.method} ${new URL(request.url).pathname} from origin: ${error}`);
	}
}
