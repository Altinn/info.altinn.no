import { extractAssetPaths } from './assets';
import {
	CURRENT_POINTER_KEY,
	manifestKey,
	objectKey,
	redirectsKey,
	SNAPSHOT_PREFIX,
	TEST_SNAPSHOT_ID_PREFIX,
	type SnapshotManifest,
	type SnapshotPointer,
} from './keys';
import { parseSitemapPaths } from './sitemap';

/** The parts of the environment the snapshot logic needs. Kept small so tests can pass fakes. */
export type SnapshotDeps = {
	origin: Pick<Fetcher, 'fetch'>;
	bucket: R2Bucket;
	kv: KVNamespace;
	siteOrigin: string;
};

export type CaptureResult = {
	stored: number;
	redirects: Record<string, string>;
	failed: { path: string; status: number | string }[];
	/** Static files referenced by the captured HTML/CSS. Captured in a later step. */
	assetPaths: string[];
};

const USER_AGENT = 'snapshot-infoportal';

/** Max pages in a test run. A larger test is just a normal run. */
export const MAX_TEST_PAGES = 500;

/**
 * Reads the optional test parameters of a run. Returns null for a normal (full) run.
 * Throws with a readable message for invalid input, so the run stops before touching anything.
 */
export function parseTestSelection(params: { limit?: unknown; paths?: unknown } | undefined): { limit?: number; paths?: string[] } | null {
	const limit = params?.limit;
	const paths = params?.paths;

	if (limit === undefined && paths === undefined) return null;
	if (limit !== undefined && paths !== undefined) throw new Error('Use either "limit" or "paths", not both');

	if (limit !== undefined) {
		if (typeof limit !== 'number' || !Number.isInteger(limit) || limit < 1 || limit > MAX_TEST_PAGES) {
			throw new Error(`"limit" must be a whole number from 1 to ${MAX_TEST_PAGES}`);
		}
		return { limit };
	}

	if (!Array.isArray(paths) || paths.length === 0 || paths.length > MAX_TEST_PAGES) {
		throw new Error(`"paths" must be a list of 1 to ${MAX_TEST_PAGES} paths`);
	}
	for (const path of paths) {
		if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//')) {
			throw new Error(`"paths" must contain site paths starting with "/", got ${JSON.stringify(path)}`);
		}
	}
	return { paths: [...new Set(paths as string[])] };
}

export async function readSitemapPaths(deps: SnapshotDeps): Promise<string[]> {
	const response = await fetchFromOrigin(deps, '/sitemap.xml');
	if (!response.ok) {
		throw new Error(`sitemap.xml returned ${response.status}`);
	}

	const paths = parseSitemapPaths(await response.text());
	if (paths.length === 0) {
		throw new Error('sitemap.xml contained no URLs');
	}
	return paths;
}

/**
 * Fetches each path from Astro and stores successful responses in R2.
 * Per-path failures are recorded instead of thrown, so a workflow retry of the batch does not
 * hide which paths failed, and a few broken pages do not stop the snapshot.
 */
export async function capturePaths(deps: SnapshotDeps, snapshotId: string, paths: string[], concurrency: number): Promise<CaptureResult> {
	const result: CaptureResult = { stored: 0, redirects: {}, failed: [], assetPaths: [] };
	const assetPaths = new Set<string>();

	await forEachWithLimit(paths, concurrency, async (path) => {
		try {
			const response = await fetchFromOrigin(deps, path);

			if (response.status >= 300 && response.status < 400) {
				const location = response.headers.get('location');
				if (location) result.redirects[path] = location;
				await response.body?.cancel();
				return;
			}

			if (response.status !== 200) {
				result.failed.push({ path, status: response.status });
				await response.body?.cancel();
				return;
			}

			const contentType = response.headers.get('content-type') ?? 'application/octet-stream';
			const body = await response.arrayBuffer();

			if (contentType.includes('text/html') || contentType.includes('text/css')) {
				const text = new TextDecoder().decode(body);
				for (const assetPath of extractAssetPaths(text, new URL(path, deps.siteOrigin).toString(), deps.siteOrigin)) {
					assetPaths.add(assetPath);
				}
			}

			await deps.bucket.put(objectKey(snapshotId, path), body, {
				httpMetadata: { contentType },
				customMetadata: { capturedAt: new Date().toISOString() },
			});
			result.stored++;
		} catch (error) {
			result.failed.push({ path, status: error instanceof Error ? error.message : String(error) });
		}
	});

	result.assetPaths = [...assetPaths];
	return result;
}

export async function writeManifest(deps: SnapshotDeps, manifest: SnapshotManifest, redirects: Record<string, string>): Promise<void> {
	await deps.bucket.put(redirectsKey(manifest.id), JSON.stringify(redirects), {
		httpMetadata: { contentType: 'application/json' },
	});
	await deps.bucket.put(manifestKey(manifest.id), JSON.stringify(manifest, null, 2), {
		httpMetadata: { contentType: 'application/json' },
	});
}

/** Returns a reason the snapshot must not be promoted, or null when it is good enough. */
export function validateManifest(manifest: SnapshotManifest, minSuccessRatio: number): string | null {
	if (manifest.sitemapUrls === 0) return 'sitemap was empty';

	const pageRatio = manifest.pages / manifest.sitemapUrls;
	if (pageRatio < minSuccessRatio) {
		return `only ${manifest.pages} of ${manifest.sitemapUrls} sitemap URLs were stored (${(pageRatio * 100).toFixed(1)}%)`;
	}
	return null;
}

export async function promoteSnapshot(deps: SnapshotDeps, pointer: SnapshotPointer): Promise<void> {
	await deps.kv.put(CURRENT_POINTER_KEY, JSON.stringify(pointer));
}

export async function readCurrentPointer(kv: KVNamespace): Promise<SnapshotPointer | null> {
	return kv.get<SnapshotPointer>(CURRENT_POINTER_KEY, 'json');
}

/**
 * Deletes old snapshots, keeping the newest `keep` snapshots and always the one `snapshot:current` points to.
 * Returns the ids that were deleted.
 */
export async function cleanupSnapshots(deps: SnapshotDeps, keep: number): Promise<string[]> {
	const current = await readCurrentPointer(deps.kv);
	// Test runs are left alone: they must not push real snapshots out of the "keep" window.
	const ids = (await listSnapshotIds(deps.bucket)).filter((id) => !id.startsWith(TEST_SNAPSHOT_ID_PREFIX));

	// Ids are ISO timestamps, so lexical order is chronological.
	const newestFirst = ids.sort().reverse();
	const toDelete = newestFirst.slice(keep).filter((id) => id !== current?.id);

	for (const id of toDelete) {
		await deletePrefix(deps.bucket, `${SNAPSHOT_PREFIX}${id}/`);
	}
	return toDelete;
}

async function listSnapshotIds(bucket: R2Bucket): Promise<string[]> {
	const ids: string[] = [];
	let cursor: string | undefined;

	do {
		const listing = await bucket.list({ prefix: SNAPSHOT_PREFIX, delimiter: '/', cursor });
		for (const prefix of listing.delimitedPrefixes) {
			ids.push(prefix.slice(SNAPSHOT_PREFIX.length).replace(/\/$/, ''));
		}
		cursor = listing.truncated ? listing.cursor : undefined;
	} while (cursor);

	return ids;
}

async function deletePrefix(bucket: R2Bucket, prefix: string): Promise<void> {
	let cursor: string | undefined;

	do {
		const listing = await bucket.list({ prefix, cursor, limit: 1000 });
		if (listing.objects.length > 0) {
			await bucket.delete(listing.objects.map((object) => object.key));
		}
		cursor = listing.truncated ? listing.cursor : undefined;
	} while (cursor);
}

/**
 * Calls Astro directly through the service binding, so the snapshot never reads from (or fills) the edge cache.
 * Redirects are not followed: they are recorded in redirects.json instead.
 */
function fetchFromOrigin(deps: SnapshotDeps, path: string): Promise<Response> {
	return deps.origin.fetch(
		new Request(new URL(path, deps.siteOrigin), {
			redirect: 'manual',
			headers: { 'user-agent': USER_AGENT },
		}),
	);
}

async function forEachWithLimit<T>(items: T[], limit: number, task: (item: T) => Promise<void>): Promise<void> {
	let next = 0;
	const workers = Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, async () => {
		while (next < items.length) {
			await task(items[next++]);
		}
	});
	await Promise.all(workers);
}

export function chunk<T>(items: T[], size: number): T[][] {
	const chunks: T[][] = [];
	for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
	return chunks;
}
