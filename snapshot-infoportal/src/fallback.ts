/**
 * Serving side of fallback mode (option B in issue #905): answers requests from the current snapshot in R2.
 *
 * Only reached through the SNAPSHOT_INFOPORTAL service binding in cache-infoportal, which decides per request
 * whether fallback mode is active (KV flag fallback:mode). This worker has no public route.
 * Never calls Astro/Umbraco. See FALLBACK.md.
 */
import { CURRENT_POINTER_KEY, notFoundKey, objectKey, redirectsKey, storagePath, type SnapshotPointer } from './keys';

export type FallbackLocale = 'nb' | 'nn' | 'en';

export type FallbackEnv = {
	SNAPSHOTS: R2Bucket;
	FALLBACK_KV: KVNamespace;
	/**
	 * Optional extra source for Umbraco media (keys media/...), for files the snapshot does not have.
	 * Not bound yet; meant for a later mirror of all Umbraco media.
	 */
	MEDIA?: R2Bucket;
};

/** Set on every fallback response, with the snapshot id, so it is easy to see where a page came from. */
export const SNAPSHOT_HEADER = 'x-infoportal-snapshot';

/** snapshot:current and redirects.json are kept in memory for a short while, so most requests only read the page. */
const KV_CACHE_TTL_SECONDS = 30;
const MEMO_TTL_MS = 15_000;

let pointerMemo: { value: SnapshotPointer | null; expires: number } | undefined;
let redirectsMemo: { id: string; redirects: Record<string, string> } | undefined;

/** For tests: forget values cached in this isolate. */
export function resetFallbackMemo(): void {
	pointerMemo = undefined;
	redirectsMemo = undefined;
}

async function readPointer(kv: KVNamespace, now = Date.now()): Promise<SnapshotPointer | null> {
	if (pointerMemo && pointerMemo.expires > now) return pointerMemo.value;
	const pointer = await kv.get<SnapshotPointer>(CURRENT_POINTER_KEY, { type: 'json', cacheTtl: KV_CACHE_TTL_SECONDS });
	pointerMemo = { value: pointer, expires: now + MEMO_TTL_MS };
	return pointer;
}

async function readRedirects(bucket: R2Bucket, id: string): Promise<Record<string, string>> {
	if (redirectsMemo?.id === id) return redirectsMemo.redirects;
	const object = await bucket.get(redirectsKey(id));
	const redirects = object ? ((await object.json()) as Record<string, string>) : {};
	redirectsMemo = { id, redirects };
	return redirects;
}

export function localeOf(pathname: string): FallbackLocale {
	if (pathname === '/nn' || pathname.startsWith('/nn/')) return 'nn';
	if (pathname === '/en' || pathname.startsWith('/en/')) return 'en';
	return 'nb';
}

function hasFileExtension(pathname: string): boolean {
	const lastSegment = pathname.split('/').pop() ?? '';
	return /\.[a-z0-9]{1,8}$/i.test(lastSegment);
}

/**
 * Finds the redirect for a path, trying the forms the snapshot may have stored it in
 * ('/a/b/', '/a/b', and with repeated slashes collapsed).
 */
export function findRedirect(redirects: Record<string, string>, pathname: string): string | undefined {
	const collapsed = pathname.replace(/\/{2,}/g, '/');
	const candidates = [pathname, collapsed];
	for (const path of [pathname, collapsed]) {
		if (!hasFileExtension(path)) candidates.push(path.endsWith('/') ? path.slice(0, -1) : `${path}/`);
	}
	for (const candidate of candidates) {
		if (candidate && Object.hasOwn(redirects, candidate)) return redirects[candidate];
	}
	return undefined;
}

/**
 * Builds the Location for a redirect. Like Astro, the query string of the incoming request is kept,
 * and same-site targets get a trailing slash (redirects from the old CMS point to '/hjelp', which
 * Astro would redirect once more to '/hjelp/').
 */
export function redirectLocation(target: string, requestUrl: URL): string {
	const location = new URL(target, requestUrl);
	if (location.origin !== requestUrl.origin) return location.toString();
	if (!location.pathname.endsWith('/') && !hasFileExtension(location.pathname)) location.pathname += '/';
	location.search = requestUrl.search;
	return `${location.pathname}${location.search}${location.hash}`;
}

/**
 * Fallback responses are cached at the edge like pages from Astro (s-maxage), so cache-infoportal can serve repeat
 * requests from the edge cache. The browser keeps them only briefly (max-age), so visitors get the live site soon
 * after fallback mode is turned off and the edge cache is purged (see FALLBACK.md).
 */
const FALLBACK_CACHE_CONTROL = 'public, max-age=60, s-maxage=86400';

function fallbackHeaders(snapshotId: string, extra: Record<string, string> = {}): Headers {
	return new Headers({ 'cache-control': FALLBACK_CACHE_CONTROL, [SNAPSHOT_HEADER]: snapshotId, ...extra });
}

function unavailable(snapshotId: string, message: string): Response {
	return new Response(message, {
		status: 503,
		// Never cached: the error is temporary.
		headers: fallbackHeaders(snapshotId, { 'content-type': 'text/plain; charset=utf-8', 'retry-after': '300', 'cache-control': 'no-store' }),
	});
}

async function serveObject(bucket: R2Bucket, key: string, request: Request, snapshotId: string, status = 200): Promise<Response | null> {
	const object = request.method === 'HEAD' ? await bucket.head(key) : await bucket.get(key);
	if (!object) return null;

	const headers = fallbackHeaders(snapshotId);
	object.writeHttpMetadata(headers);
	headers.set('etag', object.httpEtag);
	// Static files (JS, CSS, images) may stay a bit longer in the browser than pages.
	if (!(headers.get('content-type') ?? '').includes('text/html')) headers.set('cache-control', 'public, max-age=300, s-maxage=86400');

	const body = 'body' in object ? (object as R2ObjectBody).body : null;
	return new Response(request.method === 'HEAD' ? null : body, { status, headers });
}

/**
 * Serves /media/... from the snapshot: first the exact image size the URL asks for (see storagePath), then the
 * original file, then any stored size of the same file (for example when the URL has no or other image
 * parameters). Last, the optional MEDIA bucket. Returns null when nothing is found.
 */
async function serveMedia(env: FallbackEnv, url: URL, request: Request, id: string): Promise<Response | null> {
	const exact = storagePath(url);
	const found =
		(await serveObject(env.SNAPSHOTS, objectKey(id, exact), request, id)) ??
		(exact !== url.pathname ? await serveObject(env.SNAPSHOTS, objectKey(id, url.pathname), request, id) : null);
	if (found) return found;

	const variants = await env.SNAPSHOTS.list({ prefix: `${objectKey(id, url.pathname)}?`, limit: 1 });
	const variant = variants.objects[0] ? await serveObject(env.SNAPSHOTS, variants.objects[0].key, request, id) : null;
	if (variant) return variant;

	return env.MEDIA ? serveObject(env.MEDIA, url.pathname.slice(1), request, id) : null;
}

/** Serves a request from the current snapshot. Never calls Astro/Umbraco. */
export async function serveFallback(request: Request, env: FallbackEnv): Promise<Response> {
	const pointer = await readPointer(env.FALLBACK_KV);
	if (!pointer) return unavailable('none', 'Tjenesten er midlertidig utilgjengelig. / The service is temporarily unavailable.');
	const { id } = pointer;

	if (request.method !== 'GET' && request.method !== 'HEAD') {
		// Contact forms and other submissions need the live site.
		return unavailable(id, 'Skjemaet kan ikke sendes inn akkurat nå. Prøv igjen senere. / The form cannot be submitted right now. Please try again later.');
	}

	const url = new URL(request.url);
	const { pathname } = url;

	const target = findRedirect(await readRedirects(env.SNAPSHOTS, id), pathname);
	if (target) {
		return new Response(null, { status: 302, headers: fallbackHeaders(id, { location: redirectLocation(target, url) }) });
	}

	if (pathname.startsWith('/media/')) {
		const media = await serveMedia(env, url, request, id);
		if (media) return media;
	} else {
		// Pages and files by pathname; static API data with its query (see storagePath).
		const stored = await serveObject(env.SNAPSHOTS, objectKey(id, storagePath(url)), request, id);
		if (stored) return stored;

		// '/hjelp' -> '/hjelp/', as on the live site.
		if (!pathname.endsWith('/') && !hasFileExtension(pathname)) {
			const withSlash = `${pathname}/`;
			if (await env.SNAPSHOTS.head(objectKey(id, withSlash))) {
				return new Response(null, { status: 302, headers: fallbackHeaders(id, { location: `${withSlash}${url.search}` }) });
			}
		}
	}

	const locale = localeOf(pathname);
	const notFound =
		(await serveObject(env.SNAPSHOTS, notFoundKey(id, locale), request, id, 404)) ??
		(locale !== 'nb' ? await serveObject(env.SNAPSHOTS, notFoundKey(id, 'nb'), request, id, 404) : null);
	return notFound ?? new Response('Fant ikke siden / Page not found', { status: 404, headers: fallbackHeaders(id) });
}
