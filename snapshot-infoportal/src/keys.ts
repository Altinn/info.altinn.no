/**
 * Storage contract between snapshot-infoportal (writes) and cache-infoportal (reads).
 *
 * Any change here must be made in both workers at the same time.
 *
 * R2 (bucket infoportal-snapshots-{env}):
 *   snapshots/{id}/p{pathname}        one object per page or static asset (index.html appended for paths ending in "/")
 *   snapshots/{id}/manifest.json      summary of the snapshot (see SnapshotManifest)
 *   snapshots/{id}/redirects.json     { "/old/path/": "/new/path/" } for 3xx responses seen during the run
 *
 * KV (namespace infoportal-fallback-{env}):
 *   snapshot:current                  JSON SnapshotPointer. Written only after a snapshot passes validation.
 *   fallback:mode                     "on" | "off". Set manually by a developer (option B). Read by cache-infoportal.
 */

export const SNAPSHOT_PREFIX = 'snapshots/';
export const CURRENT_POINTER_KEY = 'snapshot:current';
export const FALLBACK_MODE_KEY = 'fallback:mode';

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
	sitemapUrls: number;
	pages: number;
	assets: number;
	redirects: number;
	failed: { path: string; status: number | string }[];
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

export function redirectsKey(id: string): string {
	return `${snapshotRoot(id)}redirects.json`;
}
