import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from 'cloudflare:workers';
import { NonRetryableError } from 'cloudflare:workflows';
import { EXTRA_PATHS } from './extra-paths';
import { createSnapshotId, TEST_SNAPSHOT_ID_PREFIX, type SnapshotManifest } from './keys';
import {
	captureNotFoundPages,
	capturePaths,
	chunk,
	cleanupSnapshots,
	findUnlistedLinks,
	MAX_TEST_PAGES,
	parseTestSelection,
	promoteSnapshot,
	readSitemapPaths,
	summarizeUnlisted,
	validateManifest,
	writeManifest,
	type SnapshotDeps,
} from './snapshot';

export type SnapshotParams = {
	/** "cron" or "manual". Only used for logging and the manifest. */
	trigger?: string;
	/** Test run: only the first `limit` URLs from the sitemap. */
	limit?: number;
	/** Test run: exactly these paths (for example ["/", "/hjelp/"]). EXTRA_PATHS are not added. */
	paths?: string[];
};

const BATCH_STEP = {
	retries: { limit: 3, delay: '30 seconds', backoff: 'exponential' },
	timeout: '5 minutes',
} as const;

/** Asset files can reference further assets (CSS -> fonts/images). Follow at most this many levels. */
const MAX_ASSET_ROUNDS = 3;

/** Follow links that are not in the page list at most this many levels away from a listed page. */
const MAX_LINK_ROUNDS = 3;

/**
 * Nightly snapshot of the whole site into R2.
 *
 * Every step.do() result is persisted by Workflows, so a failed or restarted instance resumes where it stopped.
 * Code outside step.do() runs again on every resume and must therefore be deterministic.
 *
 * snapshot:current is only moved after the snapshot passes validation, so a bad run (for example while
 * Umbraco is down) never replaces the last good snapshot.
 */
/**
 * The page a redirect target points at, in the form pages are listed and stored: no query string, and a trailing
 * slash unless it is a file. Astro sometimes redirects to "/om-altinn/personvern" and then on to ".../personvern/".
 */
function toPagePath(target: string): string {
	const path = target.split(/[?#]/)[0];
	const lastSegment = path.split('/').pop() ?? '';
	return path.endsWith('/') || /\.[a-z0-9]{1,8}$/i.test(lastSegment) ? path : `${path}/`;
}

export class SnapshotWorkflow extends WorkflowEntrypoint<Env, SnapshotParams> {
	async run(event: WorkflowEvent<SnapshotParams>, step: WorkflowStep) {
		if (!this.env.ASTRO_INFOPORTAL) {
			// Only bound in the named environments (at22, ...). Locally, run astro-infoportal with wrangler dev to connect it.
			throw new NonRetryableError('ASTRO_INFOPORTAL service binding is not configured');
		}

		const deps: SnapshotDeps = {
			origin: this.env.ASTRO_INFOPORTAL,
			bucket: this.env.SNAPSHOTS,
			kv: this.env.FALLBACK_KV,
			siteOrigin: this.env.SITE_ORIGIN,
		};
		const batchSize = Number(this.env.BATCH_SIZE);
		const concurrency = Number(this.env.CONCURRENCY);

		// A test run (limit or paths) is stored like a normal snapshot, but never becomes snapshot:current
		// and never deletes other snapshots. Its id starts with "test-", so it is easy to find and remove.
		let selection: ReturnType<typeof parseTestSelection>;
		try {
			selection = parseTestSelection(event.payload);
		} catch (error) {
			throw new NonRetryableError(error instanceof Error ? error.message : String(error));
		}
		const isTest = selection !== null;

		const { id, createdAt } = await step.do('create snapshot id', async () => {
			const now = new Date();
			return { id: `${isTest ? TEST_SNAPSHOT_ID_PREFIX : ''}${createSnapshotId(now)}`, createdAt: now.toISOString() };
		});

		// The full sitemap is read in test runs too: it is the list unlisted links are compared against,
		// so a test of a few pages does not report the rest of the site as missing.
		const sitemapPaths = await step.do('read sitemap', BATCH_STEP, () => readSitemapPaths(deps));
		const selectedSitemapPaths = selection?.paths ?? (selection?.limit ? sitemapPaths.slice(0, selection.limit) : sitemapPaths);
		const extraPaths = selection?.paths ? [] : EXTRA_PATHS.filter((path) => !selectedSitemapPaths.includes(path));
		const pagePaths = [...selectedSitemapPaths, ...extraPaths];
		const knownPaths = new Set<string>([...sitemapPaths, ...EXTRA_PATHS, ...pagePaths]);
		const optionalPaths = new Set<string>(EXTRA_PATHS);

		let pages = 0;
		const redirects: Record<string, string> = {};
		const failed: SnapshotManifest['failed'] = [];
		const unavailable: string[] = [];
		const unknownLinks: Record<string, string> = {};
		const seen = new Set<string>(pagePaths);
		let pendingAssets: string[] = [];

		for (const [index, batch] of chunk(pagePaths, batchSize).entries()) {
			const result = await step.do(`pages ${index + 1}`, BATCH_STEP, () =>
				capturePaths(deps, id, batch, concurrency, { knownPaths, optionalPaths }),
			);
			pages += result.stored;
			Object.assign(redirects, result.redirects);
			failed.push(...result.failed);
			unavailable.push(...result.unavailable);
			pendingAssets.push(...result.assetPaths);
			for (const [link, linkedFrom] of Object.entries(result.unknownLinks)) unknownLinks[link] ??= linkedFrom;
		}

		// Linked pages: follow internal links that are not in the page list, up to MAX_LINK_ROUNDS levels and
		// LINKED_PAGES_LIMIT pages in total. This catches pages the sitemap leaves out, such as nb-only pages linked
		// under /en/ or /nn/ (Astro shows nb content there) and pages below them (/om-altinn/...), and links that
		// redirect (recorded in redirects.json). What is left after the last round is reported as unlisted.
		const linkLimit = isTest ? MAX_TEST_PAGES : Number(this.env.LINKED_PAGES_LIMIT);
		const knownAfterLinks = new Set<string>(knownPaths);
		// Same-site redirect targets are followed like links, so a redirect never ends in a missing page.
		const addRedirectTargets = (into: Record<string, string>, found: Record<string, string>) => {
			for (const [from, target] of Object.entries(found)) {
				if (target.startsWith('/')) into[toPagePath(target)] ??= from;
			}
		};
		let pendingLinks: Record<string, string> = { ...unknownLinks };
		addRedirectTargets(pendingLinks, redirects);
		const linked: NonNullable<SnapshotManifest['linked']> = { rounds: 0, candidates: 0, skipped: 0, stored: 0, redirects: 0, failed: [] };

		for (let round = 1; round <= MAX_LINK_ROUNDS; round++) {
			const candidates = Object.keys(pendingLinks)
				.filter((path) => !seen.has(path) && !knownPaths.has(path) && !(path in redirects))
				.sort();
			// Every fetched link ends up as stored, a redirect or a failure.
			const budget = linkLimit - (linked.stored + linked.redirects + linked.failed.length);
			if (candidates.length === 0 || budget <= 0) break;

			const roundPaths = candidates.slice(0, budget);
			roundPaths.forEach((path) => {
				seen.add(path);
				knownAfterLinks.add(path);
			});
			const foundThisRound: Record<string, string> = {};
			// Over budget: left in pendingLinks for unlisted.
			for (const path of candidates.slice(budget)) foundThisRound[path] = pendingLinks[path];
			linked.rounds = round;
			linked.candidates += candidates.length;

			for (const [index, batch] of chunk(roundPaths, batchSize).entries()) {
				const result = await step.do(`linked round ${round} batch ${index + 1}`, BATCH_STEP, () =>
					capturePaths(deps, id, batch, concurrency, { knownPaths: knownAfterLinks }),
				);
				linked.stored += result.stored;
				linked.redirects += Object.keys(result.redirects).length;
				Object.assign(redirects, result.redirects);
				linked.failed.push(...result.failed);
				pendingAssets.push(...result.assetPaths);
				for (const [link, linkedFrom] of Object.entries(result.unknownLinks)) foundThisRound[link] ??= linkedFrom;
				addRedirectTargets(foundThisRound, result.redirects);
			}
			pendingLinks = foundThisRound;
		}
		linked.skipped = Object.keys(pendingLinks).filter((path) => !knownAfterLinks.has(path) && !(path in redirects)).length;
		const stillUnknown = pendingLinks;

		const notFound = await step.do('404 pages', BATCH_STEP, () => captureNotFoundPages(deps, id));
		failed.push(...notFound.failed);
		pendingAssets.push(...notFound.assetPaths);

		let assets = 0;
		for (let round = 1; round <= MAX_ASSET_ROUNDS; round++) {
			const batchPaths = [...new Set(pendingAssets)].filter((path) => !seen.has(path));
			if (batchPaths.length === 0) break;
			batchPaths.forEach((path) => seen.add(path));
			pendingAssets = [];

			for (const [index, batch] of chunk(batchPaths, batchSize).entries()) {
				const result = await step.do(`assets round ${round} batch ${index + 1}`, BATCH_STEP, () =>
					capturePaths(deps, id, batch, concurrency),
				);
				assets += result.stored;
				failed.push(...result.failed);
				pendingAssets.push(...result.assetPaths);
			}
		}

		// TODO (PoC step 2): mirror Umbraco media (/media/...) into the shared media/ prefix.

		const unlisted = findUnlistedLinks(stillUnknown, knownAfterLinks, redirects);

		const manifest = await step.do('write manifest', async () => {
			const value: SnapshotManifest = {
				id,
				createdAt,
				completedAt: new Date().toISOString(),
				siteOrigin: deps.siteOrigin,
				trigger: event.payload?.trigger ?? 'unknown',
				test: isTest,
				sitemapUrls: selectedSitemapPaths.length,
				extraPaths: extraPaths.length,
				unavailable,
				pages,
				linked,
				notFoundPages: notFound.stored,
				assets,
				redirects: Object.keys(redirects).length,
				failed,
				unlisted: summarizeUnlisted(unlisted),
			};
			await writeManifest(deps, value, redirects, unlisted);
			return value;
		});

		await step.do('validate', async () => {
			const problem = validateManifest(manifest, Number(this.env.MIN_SUCCESS_RATIO));
			if (problem) {
				// Not retryable: retrying would not change what was captured. The previous snapshot stays current.
				throw new NonRetryableError(`Snapshot ${id} not promoted: ${problem}`);
			}
		});

		if (isTest) {
			return { id, test: true, pages, assets, failed: failed.length, linked: linked.stored, unlisted: unlisted.length, promoted: false };
		}

		await step.do('promote', () => promoteSnapshot(deps, { id, createdAt }));

		const deleted = await step.do('cleanup old snapshots', () => cleanupSnapshots(deps, Number(this.env.KEEP_SNAPSHOTS)));

		return { id, test: false, pages, assets, failed: failed.length, linked: linked.stored, unlisted: unlisted.length, promoted: true, deleted };
	}
}
