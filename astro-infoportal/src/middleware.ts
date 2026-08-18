import {defineMiddleware} from 'astro:middleware';

/**
 * Adds defense-in-depth security headers to every response.
 *
 * Closes pen-test finding 4.1 (Accenture, May 2026). The headers live here in
 * the Astro app — rather than the cache worker in front — so:
 *   - Local dev (`npm run dev`) and `npm run preview` see the same headers as
 *     production, which means CSP violations get caught at development time
 *     instead of after deploy — now that CSP is enforcing (see below), that
 *     means resources can actually get blocked locally too, not just logged.
 *   - The security posture is owned by the application, not by network plumbing,
 *     and survives any future changes to the deployment topology.
 *
 * Production-safety notes (initial rollout — May 2026):
 *   - CSP was Content-Security-Policy-Report-Only from initial rollout until
 *     2026-08-11, when it was promoted to enforcing (Content-Security-Policy).
 *     This file has no per-environment branching, so the promotion is staged
 *     by *deploying* this same code environment by environment — at22 first
 *     (`wrangler deploy --env at22`), watched for a few days, then at23 →
 *     tt02 → prod — rather than by a flag in the code. Violations (blocked or,
 *     during any future report-only rollout, merely observed) are POSTed by
 *     the browser to /api/csp-reports via the `report-uri` directive below
 *     and logged there; check Workers Logs for astro-infoportal-at22 in the
 *     Cloudflare dashboard (observability is already enabled in
 *     wrangler.jsonc) before promoting further. If at22 shows unexpected
 *     violations, fix the policy or the offending code and re-deploy to at22
 *     before moving on — don't promote past an environment with open reports.
 *   - HSTS: 1 hour (initial roll) → 1 day (2026-08-11) → still to come: 1 week
 *     → 1 month → 1 year → 2 years + `includeSubDomains` + `preload`. Do NOT
 *     add `preload` until max-age has been at 63072000 (2 years) for at
 *     least a week. Each step staged the same way as the CSP promotion above
 *     — deploy to at22 first, watch for a few days, then at23 → tt02 → prod.
 *     Note: a client that already cached the previous (shorter or longer)
 *     max-age keeps enforcing that value client-side until it expires, so
 *     watch real traffic rather than assuming a fresh request reflects what
 *     every visitor's browser is doing.
 *   - X-Frame-Options is SAMEORIGIN (not DENY) to preserve any legitimate
 *     same-origin embedding. Tighten to DENY once we confirm nothing
 *     legitimately frames the portal. Still pending.
 *
 * NOTE on caching: responses produced here are stored by cache-infoportal in
 * Cloudflare's edge cache WITH these headers baked in. Changing a header value
 * requires a cache purge (or waiting for the cache to age out) before browsers
 * see the new value on previously-cached pages.
 */

// Upstream proxies sometimes return asset bytes without a Content-Type. Combined
// with the `X-Content-Type-Options: nosniff` header below, browsers refuse to
// sniff and render binaries as text. Infer the type from the URL extension so
// proxied responses (e.g. /globalassets/...xlsx) render correctly.
const MIME_TYPES: Record<string, string> = {
	'.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	'.xls': 'application/vnd.ms-excel',
	'.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	'.doc': 'application/msword',
	'.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
	'.ppt': 'application/vnd.ms-powerpoint',
	'.pdf': 'application/pdf',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.gif': 'image/gif',
	'.webp': 'image/webp',
	'.svg': 'image/svg+xml',
	'.ico': 'image/x-icon',
	'.zip': 'application/zip',
	'.txt': 'text/plain; charset=utf-8',
	'.json': 'application/json',
	'.xml': 'application/xml',
	'.css': 'text/css; charset=utf-8',
	'.js': 'application/javascript; charset=utf-8',
};

function inferContentType(pathname: string): string | null {
	const ext = pathname.toLowerCase().match(/\.[a-z0-9]+$/)?.[0];
	return ext ? MIME_TYPES[ext] ?? null : null;
}

// Note: `report-uri` is the legacy CSP reporting directive, but it still has
// materially broader browser support today than the newer `report-to` +
// `Reporting-Endpoints` header pair. Revisit if/when that changes.
const CSP_POLICY = [
	"default-src 'self'",
	"script-src 'self' 'unsafe-inline' 'unsafe-eval' https://player.vimeo.com https://siteimproveanalytics.com",
	"style-src 'self' 'unsafe-inline' https://altinncdn.no",
	"img-src 'self' data: blob: https:",
	"font-src 'self' data: https:",
	"connect-src 'self' https://*.altinn.cloud https://*.altinn.no https://altinncdn.no https://*.siteimproveanalytics.io",
	"frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com",
	"frame-ancestors 'self'",
	"base-uri 'self'",
	"form-action 'self'",
	"report-uri /api/csp-reports",
].join('; ');

function applySecurityHeaders(response: Response, pathname: string): void {
	// Skip if already set (e.g. by a downstream handler that overrides).
	const headers = response.headers;

	// Backfill Content-Type for responses that arrived without one. Proxied
	// assets are inferred from the URL extension; everything else defaults to
	// text/html so `nosniff` doesn't refuse to render the page.
	if (response.ok && !headers.has('Content-Type')) {
		headers.set('Content-Type', inferContentType(pathname) ?? 'text/html; charset=utf-8');
	}

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

	// HSTS — 1 day as of 2026-08-11 (previously 1 hour). See ratchet plan above.
	if (!headers.has('Strict-Transport-Security')) {
		headers.set('Strict-Transport-Security', 'max-age=86400');
	}

	// CSP — enforcing as of 2026-08-11. See rollout note above: promoted
	// environment-by-environment by deployment, not by a code flag. Roll back
	// to Report-Only here (and re-deploy) if an environment shows unexpected
	// blocked requests that can't be fixed quickly.
	if (
		!headers.has('Content-Security-Policy') &&
		!headers.has('Content-Security-Policy-Report-Only')
	) {
		headers.set('Content-Security-Policy', CSP_POLICY);
	}
}

export const onRequest = defineMiddleware(async (context, next) => {
	const response = await next();
	const pathname = context.url.pathname;

	try {
		applySecurityHeaders(response, pathname);
	} catch {
		// Some Response objects (e.g. from Response.redirect) have immutable headers.
		// In that rare case, rebuild the response with mutable headers.
		const rebuilt = new Response(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers: new Headers(response.headers),
		});
		applySecurityHeaders(rebuilt, pathname);
		return rebuilt;
	}

	return response;
});
