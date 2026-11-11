/**
 * Read side of the storage contract with snapshot-infoportal.
 *
 * Copy of the parts of snapshot-infoportal/src/keys.ts that cache-infoportal needs.
 * Any change to the contract must be made in both workers at the same time.
 */

export const SNAPSHOT_PREFIX = "snapshots/";
export const CURRENT_POINTER_KEY = "snapshot:current";
/** "on" turns on fallback mode for all visitors. Anything else (or missing) means off. */
export const FALLBACK_MODE_KEY = "fallback:mode";

export type SnapshotPointer = {
	id: string;
	createdAt: string;
};

export type FallbackLocale = "nb" | "nn" | "en";

export function snapshotRoot(id: string): string {
	return `${SNAPSHOT_PREFIX}${id}/`;
}

/** Key for a page or asset. Uses URL.pathname as-is (already percent-encoded), and ignores the query string. */
export function objectKey(id: string, pathname: string): string {
	const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
	const file = path.endsWith("/") ? `${path}index.html` : path;
	return `${snapshotRoot(id)}p${file}`;
}

export function notFoundKey(id: string, locale: FallbackLocale): string {
	return `${snapshotRoot(id)}404/${locale}.html`;
}

export function redirectsKey(id: string): string {
	return `${snapshotRoot(id)}redirects.json`;
}
