import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from 'cloudflare:workers';
import { NonRetryableError } from 'cloudflare:workflows';
import { createSnapshotId, type SnapshotManifest } from './keys';
import { capturePaths, chunk, cleanupSnapshots, promoteSnapshot, readSitemapPaths, validateManifest, writeManifest, type SnapshotDeps } from './snapshot';

export type SnapshotParams = {
	/** "cron" or "manual". Only used for logging and the manifest. */
	trigger?: string;
};

const BATCH_STEP = {
	retries: { limit: 3, delay: '30 seconds', backoff: 'exponential' },
	timeout: '5 minutes',
} as const;

/** Asset files can reference further assets (CSS -> fonts/images). Follow at most this many levels. */
const MAX_ASSET_ROUNDS = 3;

/**
 * Nightly snapshot of the whole site into R2.
 *
 * Every step.do() result is persisted by Workflows, so a failed or restarted instance resumes where it stopped.
 * Code outside step.do() runs again on every resume and must therefore be deterministic.
 *
 * snapshot:current is only moved after the snapshot passes validation, so a bad run (for example while
 * Umbraco is down) never replaces the last good snapshot.
 */
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

		const { id, createdAt } = await step.do('create snapshot id', async () => {
			const now = new Date();
			return { id: createSnapshotId(now), createdAt: now.toISOString() };
		});

		const pagePaths = await step.do('read sitemap', BATCH_STEP, () => readSitemapPaths(deps));

		let pages = 0;
		const redirects: Record<string, string> = {};
		const failed: SnapshotManifest['failed'] = [];
		const seen = new Set<string>(pagePaths);
		let pendingAssets: string[] = [];

		for (const [index, batch] of chunk(pagePaths, batchSize).entries()) {
			const result = await step.do(`pages ${index + 1}`, BATCH_STEP, () => capturePaths(deps, id, batch, concurrency));
			pages += result.stored;
			Object.assign(redirects, result.redirects);
			failed.push(...result.failed);
			pendingAssets.push(...result.assetPaths);
		}

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

		const manifest = await step.do('write manifest', async () => {
			const value: SnapshotManifest = {
				id,
				createdAt,
				completedAt: new Date().toISOString(),
				siteOrigin: deps.siteOrigin,
				trigger: event.payload?.trigger ?? 'unknown',
				sitemapUrls: pagePaths.length,
				pages,
				assets,
				redirects: Object.keys(redirects).length,
				failed,
			};
			await writeManifest(deps, value, redirects);
			return value;
		});

		await step.do('validate', async () => {
			const problem = validateManifest(manifest, Number(this.env.MIN_SUCCESS_RATIO));
			if (problem) {
				// Not retryable: retrying would not change what was captured. The previous snapshot stays current.
				throw new NonRetryableError(`Snapshot ${id} not promoted: ${problem}`);
			}
		});

		await step.do('promote', () => promoteSnapshot(deps, { id, createdAt }));

		const deleted = await step.do('cleanup old snapshots', () => cleanupSnapshots(deps, Number(this.env.KEEP_SNAPSHOTS)));

		return { id, pages, assets, failed: failed.length, deleted };
	}
}
