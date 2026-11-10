/**
 * Storage contract between snapshot-infoportal (writes) and cache-infoportal (reads).
 *
 * Any change here must be made in both workers at the same time.
 *
 * R2 (bucket infoportal-snapshots-{env}):
 *   snapshots/{id}/p{pathname}        one object per page or static asset (index.html appended for paths ending in "/")
 *   snapshots/{id}/manifest.json      summary of the snapshot (see SnapshotManifest)
 *   snapshots/{id}/redirects.json     { "/old/path/": "/new/path/" } for 3xx responses seen during the run.
 *                                     Same-site targets are paths (with query string); other sites keep the full URL.
 *   snapshots/{id}/404/{locale}.html  the site's 404 page per language (nb, nn, en). Serve with status 404.
 *   snapshots/{id}/unlisted.json      [{ path, linkedFrom }] every internal link that is still missing (see manifest.unlisted)
 *
 * KV (namespace infoportal-fallback-{env}):
 *   snapshot:current                  JSON SnapshotPointer. Written only after a snapshot passes validation.
 *   fallback:mode                     "on" | "off". Set manually by a developer (option B). Read by cache-infoportal.
 */

export const SNAPSHOT_PREFIX = 'snapshots/';
export const CURRENT_POINTER_KEY = 'snapshot:current';
export const FALLBACK_MODE_KEY = 'fallback:mode';
/** Test runs (a few pages) get ids like test-2026-11-10T09-15-00-000Z. They are never promoted or cleaned up automatically. */
export const TEST_SNAPSHOT_ID_PREFIX = 'test-';

export type SnapshotPointer = {
	id: string;
	createdAt: string;
};

export type SnapshotManifest = {
	id: string;
	createdAt: string;
	completedAt: string;
	siteOrigin: string;
	trigger: string;
	/** True for test runs started with `limit` or `paths`. */
	test?: boolean;
	/** Pages taken from the sitemap (or the test selection). */
	sitemapUrls: number;
	/** Astro-only pages added to the sitemap pages (EXTRA_PATHS). 0 for test runs with explicit paths. */
	extraPaths?: number;
	/** Extra paths that answered 404 in this environment (for example /llms.txt without content). Not a failure. */
	unavailable?: string[];
	/** Pages and files stored, out of sitemapUrls + extraPaths - unavailable. */
	pages: number;
	/**
	 * Pages found by following internal links that are not in the page list (one round, see LINKED_PAGES_LIMIT).
	 * Not part of validation: they are a bonus on top of the listed pages.
	 */
	linked?: {
		/** Rounds used (at most 3: links on linked pages are followed too). */
		rounds: number;
		/** Links fetched or left out, over all rounds. Not in the page list and not a known redirect. */
		candidates: number;
		/** Links not fetched, because of the limit or the last round. They are reported in unlisted. */
		skipped: number;
		stored: number;
		redirects: number;
		/** Usually broken links in content (404). */
		failed: { path: string; status: number | string }[];
	};
	/** 404 pages stored (one per language). */
	notFoundPages?: number;
	assets: number;
	redirects: number;
	failed: { path: string; status: number | string }[];
	/**
	 * Internal links that are still missing after the linked round: neither listed, captured nor a known redirect.
	 * These pages will be missing in fallback mode. Not a validation error, but should be close to 0.
	 * The full list is in unlisted.json.
	 */
	unlisted?: { count: number; sample: UnlistedLink[] };
};

export type UnlistedLink = {
	path: string;
	/** The first captured page where the link was found. */
	linkedFrom: string;
};

/** Sortable, URL- and key-safe id, e.g. 2026-11-09T02-00-00-000Z */
export function createSnapshotId(date: Date): string {
	return date.toISOString().replace(/[:.]/g, '-');
}

export function snapshotRoot(id: string): string {
	return `${SNAPSHOT_PREFIX}${id}/`;
}

/** Key for a page or asset. Uses URL.pathname as-is (already percent-encoded), and ignores the query string. */
export function objectKey(id: string, pathname: string): string {
	const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
	const file = path.endsWith('/') ? `${path}index.html` : path;
	return `${snapshotRoot(id)}p${file}`;
}

export function manifestKey(id: string): string {
	return `${snapshotRoot(id)}manifest.json`;
}

export function notFoundKey(id: string, locale: string): string {
	return `${snapshotRoot(id)}404/${locale}.html`;
}

export function unlistedKey(id: string): string {
	return `${snapshotRoot(id)}unlisted.json`;
}

export function redirectsKey(id: string): string {
	return `${snapshotRoot(id)}redirects.json`;
}
