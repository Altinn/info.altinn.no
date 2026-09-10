/**
 * The Content-Security-Policy served by the Astro middleware.
 *
 * Kept out of middleware.ts so it can be unit-tested: that module imports
 * `astro:middleware`, a virtual module only the Astro Vite plugin provides.
 * See middleware.ts for the enforcing-rollout and cache-purge notes.
 */
// Note: `report-uri` is the legacy CSP reporting directive, but it still has
// materially broader browser support today than the newer `report-to` +
// `Reporting-Endpoints` header pair. Revisit if/when that changes.
//
// Skyra (user surveys): the SDK is an SRI-pinned copy hosted in
// altinn-components and served from jsDelivr (script-src); it POSTs survey
// responses and diagnostics to ingest.skyra.no (connect-src). Loaded
// client-side by SkyraSurvey, and only cookie use is gated on consent.
export const CSP_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://player.vimeo.com https://siteimproveanalytics.com https://cdn.jsdelivr.net",
  "style-src 'self' 'unsafe-inline' https://altinncdn.no",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https:",
  "connect-src 'self' https://*.altinn.cloud https://*.altinn.no https://altinncdn.no https://*.siteimproveanalytics.io https://ingest.skyra.no",
  "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "report-uri /api/csp-reports",
].join("; ");
