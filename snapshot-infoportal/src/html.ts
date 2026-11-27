const INLINE_SCRIPT_PATTERN = /(<script\b[^>]*>)[\s\S]*?<\/script[^>]*>/gi;

/**
 * Removes the code of inline scripts but keeps the opening tag (it may have src=...). Inline scripts contain code,
 * not markup, so links and file references found in them are not real (Astro's island loader has new URL(...)).
 */
export function stripInlineScripts(html: string): string {
	return html.replace(INLINE_SCRIPT_PATTERN, '$1</script>');
}
