import type { APIRoute } from "astro";

export const prerender = false;

/**
 * Collects CSP violation reports sent by browsers via the `report-uri`
 * directive configured in ../../middleware.ts.
 *
 * We just log the raw body rather than parsing/validating it — browsers'
 * `application/csp-report` payloads vary slightly in shape, and the goal
 * here is visibility during a staged rollout (see middleware.ts), not a
 * queryable store. `observability` is already enabled in wrangler.jsonc, so
 * these land in Workers Logs per-environment (e.g. astro-infoportal-at22) —
 * check there while watching a promotion from Report-Only to enforcing, or
 * before promoting an environment further along the at22 → at23 → tt02 →
 * prod chain.
 *
 * If violation volume ever grows enough that console logs stop being a
 * practical way to review this, that's the signal to move to a real sink
 * (e.g. forward to Elasticsearch alongside search indexing, or a dedicated
 * Logpush destination) rather than growing this file.
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.text();
    console.warn("[csp-report]", body);
  } catch (error) {
    console.error("[csp-report] failed to read report body", error);
  }

  // Browsers don't read the response body; 204 avoids sending one back.
  return new Response(null, { status: 204 });
};
