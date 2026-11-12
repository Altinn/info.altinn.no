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
const BASE_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://player.vimeo.com https://siteimproveanalytics.com https://cdn.jsdelivr.net",
  "style-src 'self' 'unsafe-inline' https://altinncdn.no",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https:",
  "connect-src 'self' https://*.altinn.cloud https://*.altinn.no https://altinncdn.no https://*.siteimproveanalytics.io https://ingest.skyra.no",
  "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com",
  "base-uri 'self'",
  "form-action 'self'",
  "report-uri /api/csp-reports",
];

export const CSP_POLICY = [...BASE_DIRECTIVES, "frame-ancestors 'self'"].join(
  "; ",
);

/**
 * Umbraco backoffice origins that show /preview in an iframe (the "Forhåndsvisning"
 * view in umbraco-infoportal/App_Plugins/Preview). Every environment's CMS host is
 * listed, because this file has no per-environment branching. The preview page
 * itself is still protected by its secret.
 */
export const PREVIEW_FRAME_ANCESTORS = [
  "https://cms.at22.altinn.no",
  "https://cms.at23.altinn.no",
  "https://cms.tt02.altinn.no",
  "https://cms.prod.altinn.no",
  "https://infoportal.at22.dis-core.altinn.cloud",
  "https://infoportal.at23.dis-core.altinn.cloud",
  "https://infoportal.tt02.dis-core.altinn.cloud",
  "https://infoportal.prod.dis-core.altinn.cloud",
  "https://localhost:44391",
  "http://localhost:43450",
];

/** CSP for /preview: the same policy, except that the CMS may frame it. */
export const PREVIEW_CSP_POLICY = [
  ...BASE_DIRECTIVES,
  `frame-ancestors 'self' ${PREVIEW_FRAME_ANCESTORS.join(" ")}`,
].join("; ");

/** Pages that the CMS backoffice embeds in an iframe. */
export const isPreviewPath = (pathname: string): boolean =>
  pathname === "/preview" || pathname === "/preview/";
