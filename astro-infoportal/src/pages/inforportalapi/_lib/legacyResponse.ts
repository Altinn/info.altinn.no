// Short s-maxage until publish-driven invalidation covers these URLs.
const LEGACY_CACHE_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "public, max-age=300, s-maxage=60",
} as const;

export function legacyJson(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: LEGACY_CACHE_HEADERS,
  });
}

export function legacyError(
  message: string,
  status = 400,
  extra?: Record<string, unknown>,
): Response {
  return new Response(JSON.stringify({ error: message, ...extra }), {
    status,
    headers: LEGACY_CACHE_HEADERS,
  });
}
