import { env } from 'cloudflare:test';
import { beforeEach, describe, expect, it } from 'vitest';
import worker from '../src/index';
import { findRedirect, localeOf, redirectLocation, resetFallbackMemo, SNAPSHOT_HEADER } from '../src/fallback';
import { CURRENT_POINTER_KEY, notFoundKey, objectKey, redirectsKey } from '../src/keys';

const SITE = 'https://info.altinn.no';
const ID = '2026-11-11T08-07-50-218Z';
const MEDIA = (env as unknown as { MEDIA: R2Bucket }).MEDIA;

async function call(path: string, init: RequestInit = {}): Promise<Response> {
	return worker.fetch(new Request(`${SITE}${path}`, init) as never, env);
}

async function clearBucket(bucket: R2Bucket) {
	const listing = await bucket.list();
	if (listing.objects.length) await bucket.delete(listing.objects.map((o) => o.key));
}

beforeEach(async () => {
	resetFallbackMemo();
	await clearBucket(env.SNAPSHOTS);
	await clearBucket(MEDIA);
	await env.FALLBACK_KV.put(CURRENT_POINTER_KEY, JSON.stringify({ id: ID, createdAt: '' }));

	const html = { httpMetadata: { contentType: 'text/html; charset=utf-8' } };
	await env.SNAPSHOTS.put(objectKey(ID, '/'), 'forside', html);
	await env.SNAPSHOTS.put(objectKey(ID, '/hjelp/'), 'hjelp', html);
	await env.SNAPSHOTS.put(objectKey(ID, '/_astro/app.js'), 'js', { httpMetadata: { contentType: 'text/javascript' } });
	await env.SNAPSHOTS.put(notFoundKey(ID, 'nb'), 'fant ikke siden', html);
	await env.SNAPSHOTS.put(notFoundKey(ID, 'en'), 'page not found', html);
	await env.SNAPSHOTS.put(
		redirectsKey(ID),
		JSON.stringify({
			'/gammel/': '/hjelp/',
			'/EPiServer/CMS/Content/hjelp,,30126/': '/hjelp',
			'/ekstern/': 'https://www.altinn.no/',
		}),
	);
	await MEDIA.put('media/abc/bilde.png', 'png', { httpMetadata: { contentType: 'image/png' } });
});

describe('serving from the snapshot', () => {
	it('serves pages with no-store and the snapshot id', async () => {
		const response = await call('/hjelp/?q=1');

		expect(response.status).toBe(200);
		expect(await response.text()).toBe('hjelp');
		expect(response.headers.get('content-type')).toBe('text/html; charset=utf-8');
		expect(response.headers.get('cache-control')).toBe('no-store');
		expect(response.headers.get(SNAPSHOT_HEADER)).toBe(ID);
	});

	it('lets the browser keep static files for a short while', async () => {
		const response = await call('/_astro/app.js');
		expect(await response.text()).toBe('js');
		expect(response.headers.get('cache-control')).toBe('public, max-age=300');
	});

	it('answers HEAD without a body', async () => {
		const response = await call('/hjelp/', { method: 'HEAD' });
		expect(response.status).toBe(200);
		expect(await response.text()).toBe('');
	});

	it('redirects like the live site, keeping the query string', async () => {
		const response = await call('/gammel/?a=1');
		expect(response.status).toBe(302);
		expect(response.headers.get('location')).toBe('/hjelp/?a=1');
	});

	it('adds the trailing slash to redirect targets from the old CMS', async () => {
		const response = await call('/EPiServer/CMS/Content/hjelp,,30126/');
		expect(response.headers.get('location')).toBe('/hjelp/');
	});

	it('redirects to other sites as-is', async () => {
		const response = await call('/ekstern/?a=1');
		expect(response.headers.get('location')).toBe('https://www.altinn.no/');
	});

	it('redirects a page path without trailing slash', async () => {
		const response = await call('/hjelp?x=1');
		expect(response.status).toBe(302);
		expect(response.headers.get('location')).toBe('/hjelp/?x=1');
	});

	it('serves the 404 page in the right language, falling back to nb', async () => {
		const en = await call('/en/finnes-ikke/');
		expect(en.status).toBe(404);
		expect(await en.text()).toBe('page not found');

		const nn = await call('/nn/finst-ikkje/');
		expect(nn.status).toBe(404);
		expect(await nn.text()).toBe('fant ikke siden');
	});

	it('serves media from the media bucket', async () => {
		const response = await call('/media/abc/bilde.png');
		expect(response.status).toBe(200);
		expect(new TextDecoder().decode(await response.arrayBuffer())).toBe('png');
	});

	it('answers form posts with 503', async () => {
		const response = await call('/hjelp/skriv-til-oss/altinn/', { method: 'POST', body: 'x' });
		expect(response.status).toBe(503);
		expect(response.headers.get('retry-after')).toBe('300');
	});

	it('answers 503 when there is no current snapshot', async () => {
		await env.FALLBACK_KV.delete(CURRENT_POINTER_KEY);
		const response = await call('/hjelp/');
		expect(response.status).toBe(503);
	});
});

describe('fallback helpers', () => {
	it('finds redirects stored with or without trailing or repeated slashes', () => {
		const redirects = { '/a/': '/x/', '/b': '/y/', '/en/help//': '/en/help/' };
		expect(findRedirect(redirects, '/a')).toBe('/x/');
		expect(findRedirect(redirects, '/b/')).toBe('/y/');
		expect(findRedirect(redirects, '/en/help//')).toBe('/en/help/');
		expect(findRedirect(redirects, '/c/')).toBeUndefined();
		expect(findRedirect(redirects, '/toString')).toBeUndefined();
	});

	it('builds redirect locations like Astro', () => {
		const url = new URL(`${SITE}/gammel/?q=1`);
		expect(redirectLocation('/ny/?old=1', url)).toBe('/ny/?q=1');
		expect(redirectLocation('/ny', url)).toBe('/ny/?q=1');
		expect(redirectLocation('/fil.pdf', url)).toBe('/fil.pdf?q=1');
		expect(redirectLocation(`${SITE}/ny/`, url)).toBe('/ny/?q=1');
	});

	it('finds the locale from the path', () => {
		expect(localeOf('/')).toBe('nb');
		expect(localeOf('/nn/hjelp/')).toBe('nn');
		expect(localeOf('/en')).toBe('en');
		expect(localeOf('/energi/')).toBe('nb');
	});
});
