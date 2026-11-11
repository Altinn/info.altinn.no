import { serveFallback, type FallbackEnv } from './fallback';

export { SnapshotWorkflow } from './workflow';

/**
 * snapshot-infoportal
 *
 * Takes a full snapshot of info.altinn.no into R2 so cache-infoportal can serve the site
 * if Azure/Umbraco is unavailable. See docs/reservelosning/ and README.md.
 *
 * Starts a SnapshotWorkflow instance:
 *   - nightly via the cron trigger in wrangler.jsonc
 *   - manually: pnpm wrangler workflows trigger snapshot-infoportal-<env> '{"trigger":"manual"}'
 *
 * fetch() serves the site from the current snapshot (fallback mode, see FALLBACK.md and src/fallback.ts).
 * The worker has no public route: requests only arrive through the SNAPSHOT_INFOPORTAL service binding in
 * cache-infoportal, when fallback mode is active.
 */
export default {
	async scheduled(_controller, env, ctx) {
		ctx.waitUntil(
			env.SNAPSHOT_WORKFLOW.create({ params: { trigger: 'cron' } }).then((instance) => {
				console.log(`Started snapshot workflow instance ${instance.id}`);
			}),
		);
	},

	async fetch(request, env) {
		// MEDIA is only bound once the backup job writes the media mirror to R2.
		return serveFallback(request, env as Env & FallbackEnv);
	},
} satisfies ExportedHandler<Env>;
