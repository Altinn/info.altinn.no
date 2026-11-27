/**
 * Extracts unique pathnames from a sitemap.xml (urlset) document.
 *
 * Astro serves all locales (nb, nn, en) in /sitemap.xml, so one document covers the whole site.
 * Only <loc> is used; <xhtml:link> alternates point at URLs that are also listed as <loc>.
 */
export function parseSitemapPaths(xml: string): string[] {
	const paths = new Set<string>();

	for (const match of xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)) {
		try {
			paths.add(new URL(decodeXmlEntities(match[1])).pathname);
		} catch {
			// Ignore malformed entries rather than failing the whole snapshot.
		}
	}

	return [...paths];
}

function decodeXmlEntities(value: string): string {
	return value
		.replaceAll('&lt;', '<')
		.replaceAll('&gt;', '>')
		.replaceAll('&quot;', '"')
		.replaceAll('&apos;', "'")
		.replaceAll('&amp;', '&');
}
