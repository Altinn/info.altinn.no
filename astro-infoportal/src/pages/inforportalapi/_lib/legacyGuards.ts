// Keeps the edge cache key stable and blocks cache-busting via ?bust=N.
export function rejectIfQueryString(url: URL): Response | null {
  if (url.searchParams.size > 0) {
    return new Response(
      JSON.stringify({ error: "query parameters not supported" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      },
    );
  }
  return null;
}

export type MunicipalityIdKind = "guid" | "legacy" | "invalid";

const GUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NUMERIC_RE = /^\d+$/;

// Numeric IDs are legacy Optimizely ContentReferences and won't resolve in Umbraco.
export function classifyMunicipalityId(id: string): MunicipalityIdKind {
  if (GUID_RE.test(id)) return "guid";
  if (NUMERIC_RE.test(id)) return "legacy";
  return "invalid";
}
