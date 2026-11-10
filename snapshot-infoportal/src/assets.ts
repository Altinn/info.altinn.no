/**
 * Finds same-origin static files (CSS, JS, images, fonts, favicons ...) referenced by an HTML page or a CSS file,
 * so they can be stored in the snapshot next to the pages.
 *
 * Page links (no file extension) are ignored: pages come from the sitemap.
 * /media/ is ignored: Umbraco media gets its own shared mirror in a later step of the PoC.
 */
const ATTRIBUTE_PATTERN = /\b(?:src|href)\s*=\s*["']([^"']+)["']/gi;
const SRCSET_PATTERN = /\bsrcset\s*=\s*["']([^"']+)["']/gi;
// Case-sensitive on purpose: CSS uses url(...), while JavaScript has `new URL(...)`, which is not a file reference.
const CSS_URL_PATTERN = /\burl\(\s*["']?([^"')]+)["']?\s*\)/g;
// Inline scripts contain code, not markup. Keep the opening tag (it may have src=...), drop the body.
const INLINE_SCRIPT_PATTERN = /(<script\b[^>]*>)[\s\S]*?<\/script>/gi;

const EXCLUDED_PREFIXES = ['/media/', '/api/'];

export function extractAssetPaths(body: string, pageUrl: string, siteOrigin: string): string[] {
	const candidates: string[] = [];
	body = body.replace(INLINE_SCRIPT_PATTERN, '$1</script>');

	for (const match of body.matchAll(ATTRIBUTE_PATTERN)) candidates.push(match[1]);
	for (const match of body.matchAll(SRCSET_PATTERN)) {
		for (const entry of match[1].split(',')) candidates.push(entry.trim().split(/\s+/)[0]);
	}
	for (const match of body.matchAll(CSS_URL_PATTERN)) candidates.push(match[1]);

	const origin = new URL(siteOrigin).origin;
	const paths = new Set<string>();

	for (const candidate of candidates) {
		if (!candidate || candidate.startsWith('data:') || candidate.startsWith('#')) continue;

		let url: URL;
		try {
			url = new URL(candidate, pageUrl);
		} catch {
			continue;
		}

		if (url.origin !== origin) continue;
		if (EXCLUDED_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) continue;
		if (!hasFileExtension(url.pathname)) continue;

		paths.add(url.pathname);
	}

	return [...paths];
}

function hasFileExtension(pathname: string): boolean {
	const lastSegment = pathname.split('/').pop() ?? '';
	return /\.[a-z0-9]{1,8}$/i.test(lastSegment);
}
