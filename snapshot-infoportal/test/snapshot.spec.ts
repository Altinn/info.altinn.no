import { env } from 'cloudflare:test';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { extractAssetPaths } from '../src/assets';
import { CURRENT_POINTER_KEY, createSnapshotId, objectKey, type SnapshotManifest } from '../src/keys';
import { parseSitemapPaths } from '../src/sitemap';
import { capturePaths, cleanupSnapshots, parseTestSelection, readSitemapPaths, validateManifest, type SnapshotDeps } from '../src/snapshot';

const SITE = 'https://info.altinn.no';

function fakeOrigin(routes: Record<string, () => Response>) {
	const fetch = vi.fn(async (input: RequestInfo | URL) => {
		const path = new URL(input instanceof Request ? input.url : input.toString()).pathname;
		const route = routes[path];
		if (!route) return new Response('not found', { status: 404 });
		return route();
	});
	return { fetch } as unknown as Pick<Fetcher, 'fetch'> & { fetch: typeof fetch };
}

function deps(origin: Pick<Fetcher, 'fetch'>): SnapshotDeps {
	return { origin, bucket: env.SNAPSHOTS, kv: env.FALLBACK_KV, siteOrigin: SITE };
}

async function clearBucket() {
	const listing = await env.SNAPSHOTS.list();
	if (listing.objects.length) await env.SNAPSHOTS.delete(listing.objects.map((o) => o.key));
}

describe('keys', () => {
	it('maps paths to R2 keys', () => {
		expect(objectKey('abc', '/')).toBe('snapshots/abc/p/index.html');
		expect(objectKey('abc', '/nn/hjelp/')).toBe('snapshots/abc/p/nn/hjelp/index.html');
		expect(objectKey('abc', '/vendor.css')).toBe('snapshots/abc/p/vendor.css');
	});

	it('creates sortable snapshot ids', () => {
		const a = createSnapshotId(new Date('2026-11-09T02:00:00Z'));
		const b = createSnapshotId(new Date('2026-11-10T02:00:00Z'));
		expect(a).toBe('2026-11-09T02-00-00-000Z');
		expect([b, a].sort()).toEqual([a, b]);
	});
});

describe('parseSitemapPaths', () => {
	it('returns unique pathnames from <loc>', () => {
		const xml = `<urlset>
			<url><loc>https://info.altinn.no/</loc><xhtml:link href="https://info.altinn.no/nn/" /></url>
			<url><loc> https://info.altinn.no/nn/ </loc></url>
			<url><loc>https://info.altinn.no/sok/?q=a&amp;b=c</loc></url>
			<url><loc>https://info.altinn.no/</loc></url>
		</urlset>`;
		expect(parseSitemapPaths(xml)).toEqual(['/', '/nn/', '/sok/']);
	});
});

describe('extractAssetPaths', () => {
	it('finds same-origin static files and ignores pages, media, external and data URLs', () => {
		const html = `
			<link href="/vendor.css" rel="stylesheet"><link href="/assets/favicon/favicon.ico">
			<img src="/assets/img/a.svg" srcset="/assets/img/b.png 1x, /assets/img/c.png 2x">
			<script src="/_astro/app.123.js"></script>
			<a href="/hjelp/">Hjelp</a> <a href="https://www.altinn.no/x.css">ext</a>
			<img src="/media/abc/bilde.png"> <img src="data:image/png;base64,AAA">
			<style>.x { background: url('/assets/img/d.webp') }</style>`;

		expect(extractAssetPaths(html, `${SITE}/`, SITE).sort()).toEqual(
			[
				'/vendor.css',
				'/assets/favicon/favicon.ico',
				'/assets/img/a.svg',
				'/assets/img/b.png',
				'/assets/img/c.png',
				'/_astro/app.123.js',
				'/assets/img/d.webp',
			].sort(),
		);
	});

	it('ignores code in inline scripts, such as Astro\'s island loader', () => {
		// From the real at22 HTML: `new URL(e,document.baseURI)` was read as a CSS url() and became
		// /<page>/e,document.baseURI, which then returned 404 for every page.
		const html = `<script src="/_astro/client.js"></script>
			<script>getRetryImportUrl(e){let r=new URL(e,document.baseURI);let s="/assets/x.png";}</script>
			<div style="background:url(/assets/img/y.svg)"></div>`;

		expect(extractAssetPaths(html, `${SITE}/en/`, SITE).sort()).toEqual(['/_astro/client.js', '/assets/img/y.svg']);
	});

	it('resolves relative CSS urls against the file they appear in', () => {
		expect(extractAssetPaths('src: url(../fonts/x.woff2)', `${SITE}/assets/css/site.css`, SITE)).toEqual(['/assets/fonts/x.woff2']);
	});
});

describe('readSitemapPaths', () => {
	it('fails when sitemap is unavailable, so the workflow step retries', async () => {
		const origin = fakeOrigin({ '/sitemap.xml': () => new Response('down', { status: 503 }) });
		await expect(readSitemapPaths(deps(origin))).rejects.toThrow('503');
	});
});

describe('capturePaths', () => {
	beforeEach(clearBucket);

	it('stores 200 responses, records redirects and failures, and reports referenced assets', async () => {
		const origin = fakeOrigin({
			'/': () => new Response('<link href="/vendor.css">', { headers: { 'content-type': 'text/html; charset=utf-8' } }),
			'/gammel/': () => new Response(null, { status: 301, headers: { location: '/ny/' } }),
			'/feil/': () => new Response('error', { status: 500 }),
			'/kaster/': () => {
				throw new Error('network down');
			},
		});

		const result = await capturePaths(deps(origin), 'snap1', ['/', '/gammel/', '/feil/', '/kaster/', '/mangler/'], 2);

		expect(result.stored).toBe(1);
		expect(result.redirects).toEqual({ '/gammel/': '/ny/' });
		expect(result.failed).toEqual(
			expect.arrayContaining([
				{ path: '/feil/', status: 500 },
				{ path: '/kaster/', status: 'network down' },
				{ path: '/mangler/', status: 404 },
			]),
		);
		expect(result.assetPaths).toEqual(['/vendor.css']);

		const stored = await env.SNAPSHOTS.get('snapshots/snap1/p/index.html');
		expect(await stored?.text()).toBe('<link href="/vendor.css">');
		expect(stored?.httpMetadata?.contentType).toBe('text/html; charset=utf-8');

		const request = origin.fetch.mock.calls[0][0] as Request;
		expect(request.redirect).toBe('manual');
	});
});

describe('validateManifest', () => {
	const manifest = (pages: number, sitemapUrls: number) => ({ pages, sitemapUrls }) as SnapshotManifest;

	it('accepts a snapshot above the threshold', () => {
		expect(validateManifest(manifest(99, 100), 0.98)).toBeNull();
	});

	it('rejects a snapshot taken while the origin was failing', () => {
		expect(validateManifest(manifest(10, 100), 0.98)).toContain('only 10 of 100');
	});
});

describe('parseTestSelection', () => {
	it('treats a run without limit or paths as a normal run', () => {
		expect(parseTestSelection(undefined)).toBeNull();
		expect(parseTestSelection({})).toBeNull();
	});

	it('accepts a limit or a list of paths', () => {
		expect(parseTestSelection({ limit: 10 })).toEqual({ limit: 10 });
		expect(parseTestSelection({ paths: ['/', '/hjelp/', '/'] })).toEqual({ paths: ['/', '/hjelp/'] });
	});

	it.each([
		[{ limit: 0 }, 'limit'],
		[{ limit: 2.5 }, 'limit'],
		[{ limit: '10' }, 'limit'],
		[{ limit: 100000 }, 'limit'],
		[{ paths: [] }, 'paths'],
		[{ paths: ['hjelp'] }, 'paths'],
		[{ paths: ['https://evil.example/'] }, 'paths'],
		[{ paths: ['//evil.example/'] }, 'paths'],
		[{ limit: 5, paths: ['/'] }, 'either'],
	])('rejects %j', (params, message) => {
		expect(() => parseTestSelection(params)).toThrow(message);
	});
});

describe('cleanupSnapshots', () => {
	beforeEach(clearBucket);

	it('keeps the newest snapshots and never deletes the current one', async () => {
		const ids = ['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05'];
		for (const id of ids) await env.SNAPSHOTS.put(`snapshots/${id}/p/index.html`, id);
		await env.FALLBACK_KV.put(CURRENT_POINTER_KEY, JSON.stringify({ id: '2026-11-01', createdAt: '' }));

		await env.SNAPSHOTS.put('snapshots/test-2026-11-06/p/index.html', 'test run');

		const deleted = await cleanupSnapshots(deps(fakeOrigin({})), 2);

		expect(deleted.sort()).toEqual(['2026-11-02', '2026-11-03']);
		const remaining = (await env.SNAPSHOTS.list()).objects.map((o) => o.key).sort();
		expect(remaining).toEqual([
			'snapshots/2026-11-01/p/index.html',
			'snapshots/2026-11-04/p/index.html',
			'snapshots/2026-11-05/p/index.html',
			'snapshots/test-2026-11-06/p/index.html',
		]);
	});
});
