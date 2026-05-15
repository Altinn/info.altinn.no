import {defineMiddleware} from 'astro:middleware';

/**
 * Adds defense-in-depth security headers to every response.
 *
 * Closes pen-test finding 4.1 (Accenture, May 2026). The headers live here in
 * the Astro app — rather than the cache worker in front — so:
 *   - Local dev (`npm run dev`) and `npm run preview` see the same headers as
 *     production, which means CSP-Report-Only violations get caught at
 *     development time instead of after deploy.
 *   - The security posture is owned by the application, not by network plumbing,
 *     and survives any future changes to the deployment topology.
 *
 * Production-safety notes (initial rollout — May 2026):
 *   - CSP is sent as Content-Security-Policy-Report-Only. By spec this NEVER
 *     blocks a resource; it only records violations to the browser console.
 *     Promote to enforcing (rename the header) after ~1 week of observation.
 *   - HSTS uses a deliberately short max-age (1 hour) for the initial roll.
 *     Ratchet up over the following weeks: 1 day → 1 week → 1 month → 1 year
 *     → 2 years + `includeSubDomains` + `preload`. Do NOT add `preload` until
 *     max-age has been at 63072000 (2 years) for at least a week.
 *   - X-Frame-Options is SAMEORIGIN (not DENY) to preserve any legitimate
 *     same-origin embedding. Tighten to DENY once we confirm nothing
 *     legitimately frames the portal.
 *
 * NOTE on caching: responses produced here are stored by cache-infoportal in
 * Cloudflare's edge cache WITH these headers baked in. Changing a header value
 * requires a cache purge (or waiting for the cache to age out) before browsers
 * see the new value on previously-cached pages.
 */

const CSP_REPORT_ONLY = [
	"default-src 'self'",
	"script-src 'self' 'unsafe-inline' 'unsafe-eval' https://player.vimeo.com",
	"style-src 'self' 'unsafe-inline' https://altinncdn.no",
	"img-src 'self' data: blob: https:",
	"font-src 'self' data: https:",
	"connect-src 'self' https://*.altinn.cloud https://*.altinn.no https://altinncdn.no",
	"frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com",
	"frame-ancestors 'self'",
	"base-uri 'self'",
	"form-action 'self'",
].join('; ');

function applySecurityHeaders(response: Response): void {
	// Skip if already set (e.g. by a downstream handler that overrides).
	const headers = response.headers;

	// Zero-risk headers — only block misbehavior, never correct behavior.
	if (!headers.has('X-Content-Type-Options')) {
		headers.set('X-Content-Type-Options', 'nosniff');
	}
	if (!headers.has('Referrer-Policy')) {
		headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	}
	if (!headers.has('Permissions-Policy')) {
		headers.set(
			'Permissions-Policy',
			'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
		);
	}

	// Low-risk: same-origin framing is preserved; cross-origin framing is blocked.
	if (!headers.has('X-Frame-Options')) {
		headers.set('X-Frame-Options', 'SAMEORIGIN');
	}

	// HSTS — start short. See note above on ratchet plan.
	if (!headers.has('Strict-Transport-Security')) {
		headers.set('Strict-Transport-Security', 'max-age=3600');
	}

	// CSP in Report-Only mode for the initial rollout — observes but does not block.
	if (
		!headers.has('Content-Security-Policy') &&
		!headers.has('Content-Security-Policy-Report-Only')
	) {
		headers.set('Content-Security-Policy-Report-Only', CSP_REPORT_ONLY);
	}
}

export const onRequest = defineMiddleware(async (_context, next) => {
	const response = await next();

	try {
		applySecurityHeaders(response);
	} catch {
		// Some Response objects (e.g. from Response.redirect) have immutable headers.
		// In that rare case, rebuild the response with mutable headers.
		const rebuilt = new Response(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers: new Headers(response.headers),
		});
		applySecurityHeaders(rebuilt);
		return rebuilt;
	}

	return response;
});
