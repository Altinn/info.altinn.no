const PAGE_CACHE =
  "public, max-age=1440, s-maxage=86400, stale-while-revalidate=86400";
// Short, so a file added later at a probed path is served soon after deploy.
const NOT_FOUND_CACHE = "public, max-age=300, s-maxage=300";

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

export function notFoundCacheControl(hostname: string): string {
  return isLocalHost(hostname) ? "no-store" : NOT_FOUND_CACHE;
}
