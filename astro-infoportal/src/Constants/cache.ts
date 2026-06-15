const PAGE_CACHE =
  "public, max-age=1440, s-maxage=86400, stale-while-revalidate=86400";

function isLocalHost(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname.endsWith(".localhost")
  );
}

export function pageCacheControl(hostname: string): string {
  return isLocalHost(hostname) ? "no-store" : PAGE_CACHE;
}
