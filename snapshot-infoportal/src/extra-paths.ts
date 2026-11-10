/**
 * Pages that Astro renders itself, without an Umbraco node, so they are not in sitemap.xml.
 * They are the same in every environment, so they live in code rather than in wrangler.jsonc.
 *
 * Keep in sync with astro-infoportal/src/pages/ (sok.astro, hjelp/skriv-til-oss/[form].astro, robots.txt.ts, ...).
 */
export const EXTRA_PATHS = [
	// Search pages (excluded from the sitemap for SEO reasons). Only the empty page; results need the live site.
	'/sok/',
	'/nn/sok/',
	'/en/search/',
	// Contact forms (Astro routes, the variants are hard-coded in the [form].astro files).
	'/hjelp/skriv-til-oss/altinn/',
	'/hjelp/skriv-til-oss/bedrift/',
	'/nn/hjelp/skriv-til-oss/altinn/',
	'/nn/hjelp/skriv-til-oss/bedrift/',
	'/en/help/write-to-us/altinn/',
	'/en/help/write-to-us/business/',
	// Files for crawlers.
	'/robots.txt',
	'/llms.txt',
	'/sitemap.xml',
	'/nn/sitemap.xml',
	'/en/sitemap.xml',
] as const;

/**
 * The 404 page is captured by requesting a path that does not exist, once per language.
 * cache-infoportal serves it (with status 404) for paths that are not in the snapshot.
 */
export const NOT_FOUND_PROBES = [
	{ locale: 'nb', path: '/__snapshot-404__/' },
	{ locale: 'nn', path: '/nn/__snapshot-404__/' },
	{ locale: 'en', path: '/en/__snapshot-404__/' },
] as const;
