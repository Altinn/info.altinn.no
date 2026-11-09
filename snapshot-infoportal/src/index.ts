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
 * The worker has no public routes. fetch() exists only so `wrangler dev` has something to answer.
 */
export default {
	async scheduled(_controller, env, ctx) {
		ctx.waitUntil(
			env.SNAPSHOT_WORKFLOW.create({ params: { trigger: 'cron' } }).then((instance) => {
				console.log(`Started snapshot workflow instance ${instance.id}`);
			}),
		);
	},

	async fetch() {
		return new Response('Not found', { status: 404 });
	},
} satisfies ExportedHandler<Env>;
