const SHORT_CMS_CACHE =
  "public, max-age=0, s-maxage=300, stale-while-revalidate=86400";

function isLocalHost(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname.endsWith(".localhost")
  );
}

function isNonProductionHost(hostname: string): boolean {
  return (
    isLocalHost(hostname) ||
    hostname.includes("at22") ||
    hostname.includes("test") ||
    hostname.endsWith(".workers.dev") ||
    hostname.endsWith(".pages.dev")
  );
}

export function pageCacheControl(hostname: string): string {
  return isNonProductionHost(hostname) ? "no-store" : SHORT_CMS_CACHE;
}
