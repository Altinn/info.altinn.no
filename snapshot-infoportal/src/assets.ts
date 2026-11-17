import { SNAPSHOT_API_PREFIXES, storagePath } from './keys';

/**
 * Finds same-origin static files (CSS, JS, images, fonts, favicons ...) referenced by an HTML page, a CSS file
 * or a JavaScript module, so they can be stored in the snapshot next to the pages.
 *
 * Page links (no file extension) are ignored: pages come from the sitemap.
 * Umbraco media (/media/...) is included, so images and documents work in fallback mode. Media keeps its image
 * parameters (?width=698&height=488 for ImageSharp, see storagePath), so the snapshot stores the same resized file
 * the page shows. Other files are stored by pathname only.
 *
 * Static API data (SNAPSHOT_API_PREFIXES, for example /api/subsidies/nb) is found in the props of Astro islands
 * and returned as well, so the support schemes overview and the municipality search work in fallback mode.
 */
// component-url, renderer-url and before-hydration-url are how Astro islands load their JavaScript
// (<astro-island component-url="/SiteLayout.js" renderer-url="/client.js">). Without them no React component runs.
const ATTRIBUTE_PATTERN = /\b(?:src|href|component-url|renderer-url|before-hydration-url)\s*=\s*["']([^"']+)["']/gi;
const SRCSET_PATTERN = /\bsrcset\s*=\s*["']([^"']+)["']/gi;
// Case-sensitive on purpose: CSS uses url(...), while JavaScript has `new URL(...)`, which is not a file reference.
const CSS_URL_PATTERN = /\burl\(\s*["']?([^"')]+)["']?\s*\)/g;
// Inline scripts contain code, not markup. Keep the opening tag (it may have src=...), drop the body.
const INLINE_SCRIPT_PATTERN = /(<script\b[^>]*>)[\s\S]*?<\/script>/gi;

// JavaScript modules: static and dynamic imports (from"./vendor.js", import("./chunk.js"), import"./x.js").
const SCRIPT_IMPORT_PATTERN = /\b(?:from|import)\s*\(?\s*["'`]([^"'`\s]+\.m?js)["'`]/g;
// Absolute paths to static files written as strings in JavaScript ("/assets/img/x.svg").
const SCRIPT_ASSET_PATTERN = /["'`](\/[A-Za-z0-9_.\/-]+\.(?:png|svg|jpe?g|webp|avif|gif|ico|woff2?|css|m?js|json))["'`]/g;

const EXCLUDED_PREFIXES = ['/api/'];

// Astro island props are HTML-escaped JSON: props="{&quot;subsidyApiUrl&quot;:[0,&quot;/api/subsidies/nb&quot;]}".
// Matched after &quot; is decoded.
const API_URL_PATTERN = /"(\/api\/[^"\s]+)"/g;

/** Finds the modules and static files a JavaScript file loads. */
export function extractScriptAssetPaths(body: string, scriptUrl: string, siteOrigin: string): string[] {
	const candidates: string[] = [];
	for (const match of body.matchAll(SCRIPT_IMPORT_PATTERN)) candidates.push(match[1]);
	for (const match of body.matchAll(SCRIPT_ASSET_PATTERN)) candidates.push(match[1]);
	return toSameOriginFiles(candidates, scriptUrl, siteOrigin);
}

export function extractAssetPaths(body: string, pageUrl: string, siteOrigin: string): string[] {
	const candidates: string[] = [];
	body = body.replace(INLINE_SCRIPT_PATTERN, '$1</script>');

	for (const match of body.matchAll(ATTRIBUTE_PATTERN)) candidates.push(match[1]);
	for (const match of body.matchAll(SRCSET_PATTERN)) {
		for (const entry of match[1].split(',')) candidates.push(entry.trim().split(/\s+/)[0]);
	}
	for (const match of body.matchAll(CSS_URL_PATTERN)) candidates.push(match[1]);

	return [...toSameOriginFiles(candidates, pageUrl, siteOrigin), ...extractApiPaths(body, pageUrl, siteOrigin)];
}

/** Finds static API data (SNAPSHOT_API_PREFIXES) that a page loads in the browser. */
function extractApiPaths(body: string, pageUrl: string, siteOrigin: string): string[] {
	const decoded = body.replace(/&quot;/gi, '"');
	const paths = new Set<string>();

	for (const match of decoded.matchAll(API_URL_PATTERN)) {
		const url = toSameOriginUrl(match[1], pageUrl, siteOrigin);
		if (url && SNAPSHOT_API_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) paths.add(storagePath(url));
	}

	return [...paths];
}

function toSameOriginFiles(candidates: string[], baseUrl: string, siteOrigin: string): string[] {
	const paths = new Set<string>();

	for (const candidate of candidates) {
		if (!candidate || candidate.startsWith('data:') || candidate.startsWith('#')) continue;

		const url = toSameOriginUrl(candidate, baseUrl, siteOrigin);
		if (!url) continue;
		if (EXCLUDED_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) continue;
		if (!hasFileExtension(url.pathname)) continue;

		paths.add(storagePath(url));
	}

	return [...paths];
}

/** Resolves a reference found in HTML, CSS or JavaScript. Null if it is invalid or points to another site. */
function toSameOriginUrl(reference: string, baseUrl: string, siteOrigin: string): URL | null {
	try {
		// Attribute values in HTML escape & as &amp; (src="/media/a.png??rmode=max&amp;width=698").
		const url = new URL(reference.replace(/&amp;/gi, '&'), baseUrl);
		return url.origin === new URL(siteOrigin).origin ? url : null;
	} catch {
		return null;
	}
}

function hasFileExtension(pathname: string): boolean {
	const lastSegment = pathname.split('/').pop() ?? '';
	return /\.[a-z0-9]{1,8}$/i.test(lastSegment);
}
