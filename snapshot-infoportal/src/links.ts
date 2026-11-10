/**
 * Finds internal page links (<a href>) in captured HTML.
 *
 * Used to discover pages that are linked from the site but missing from the page list (sitemap + extra paths),
 * so they can be reported in the manifest as "unlisted". Static files are handled by assets.ts.
 */
const ANCHOR_HREF_PATTERN = /<a\b[^>]*?\bhref\s*=\s*["']([^"']+)["']/gi;
const INLINE_SCRIPT_PATTERN = /(<script\b[^>]*>)[\s\S]*?<\/script>/gi;

/** Not pages: media and APIs are served by Umbraco/Astro handlers, not rendered pages. */
const EXCLUDED_PREFIXES = ['/media/', '/api/', '/umbraco/', '/inforportalapi/'];

/**
 * Returns the normalized pathnames ("/a/b/") of same-origin page links. Query strings and #anchors are dropped,
 * and a trailing slash is added, because that is how pages are listed and stored.
 * Case is kept: R2 keys are case-sensitive, so a link with different case is a real gap in the fallback.
 */
export function extractPageLinks(html: string, pageUrl: string, siteOrigin: string): string[] {
	const origin = new URL(siteOrigin).origin;
	const links = new Set<string>();
	html = html.replace(INLINE_SCRIPT_PATTERN, '$1</script>');

	for (const match of html.matchAll(ANCHOR_HREF_PATTERN)) {
		const href = decodeHtmlEntities(match[1].trim());
		if (!href || href.startsWith('#')) continue;

		let url: URL;
		try {
			url = new URL(href, pageUrl);
		} catch {
			continue;
		}

		// Other sites, mailto:, tel:, javascript: all have a different origin.
		if (url.origin !== origin) continue;
		if (EXCLUDED_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) continue;
		if (hasFileExtension(url.pathname)) continue;

		links.add(url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`);
	}

	return [...links];
}

function hasFileExtension(pathname: string): boolean {
	const lastSegment = pathname.split('/').pop() ?? '';
	return /\.[a-z0-9]{1,8}$/i.test(lastSegment);
}

function decodeHtmlEntities(value: string): string {
	return value.replaceAll('&amp;', '&').replaceAll('&#x2F;', '/').replaceAll('&#47;', '/');
}
