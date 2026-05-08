import {
  UMBRACO_API_URL,
  resolveUmbracoPublicUrl,
  fetchUmbracoContentList,
} from "./client";

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

/**
 * Replace all occurrences of the Umbraco internal base URL with the public-facing URL.
 */
export function rewriteUrls(content: string, publicBaseUrl?: string): string {
  const umbracoOrigin = new URL(UMBRACO_API_URL).origin;
  const publicUrl = (publicBaseUrl ?? resolveUmbracoPublicUrl()).replace(/\/+$/, "");
  return content.replaceAll(umbracoOrigin, publicUrl);
}

/**
 * Standard cache headers for SEO text files.
 * 1 hour browser cache, 24 hour edge cache (s-maxage).
 */
export function seoCacheHeaders(
  contentType = "text/plain; charset=utf-8",
): Record<string, string> {
  return {
    "Content-Type": contentType,
    "Cache-Control": "public, max-age=3600, s-maxage=86400",
  };
}

/**
 * Fetch the SEO configuration page from Umbraco.
 * Expects a content type `seoConfigurationPage` with fields
 * `robotsTxtContent`, `llmsTxtContent`, and `securityTxtContent`.
 */
export async function fetchSeoConfiguration(): Promise<Record<string, unknown> | null> {
  try {
    const items = await fetchUmbracoContentList(
      ["contentType:seoConfigurationPage"],
      1,
    );
    return items[0] ?? null;
  } catch {
    return null;
  }
}

/**
 * Fetch a raw file (robots.txt, sitemap.xml, etc.) directly from the Umbraco origin.
 */
export async function fetchFromUmbracoOrigin(
  path: string,
  timeoutMs = 15000,
): Promise<Response> {
  const url = `${trimTrailingSlash(UMBRACO_API_URL)}${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export function shouldRewriteUmbracoOrigin(): boolean {
  return new URL(UMBRACO_API_URL).origin !== new URL(resolveUmbracoPublicUrl()).origin;
}

export function configuredTextResponse(
  content: string,
  contentType = "text/plain; charset=utf-8",
  publicBaseUrl?: string,
): Response {
  return new Response(rewriteUrls(content, publicBaseUrl), {
    headers: seoCacheHeaders(contentType),
  });
}

export function missingSeoConfigurationResponse(fileName: string): Response {
  return new Response(`${fileName} is not configured in Umbraco.`, {
    status: 404,
    headers: seoCacheHeaders(),
  });
}

export function unavailableSeoProxyResponse(fileName: string): Response {
  return new Response(`${fileName} is not available from Umbraco.`, {
    status: 502,
    headers: seoCacheHeaders(),
  });
}
