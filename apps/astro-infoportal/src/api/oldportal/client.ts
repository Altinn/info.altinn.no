import { env } from "cloudflare:workers";

export async function fetchFromOldPortal(path: string) {
  const url = `https://prod.info.altinn.no${path}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch from old portal: ${response.statusText} ${url}`);
  }

  return await response.bytes();
}

export function shouldFetchFromOldPortal(path: string):boolean {
  const pagesFromOldPortal = env.PAGES_FROM_OLD_PORTAL;

  if (!pagesFromOldPortal) {
    return false;
  }

  if (path.match(/\.[a-zA-Z0-9]+$/)) {
    /* Asset that does not exist in Astro */
    return true;
  }

  for (const prefix of pagesFromOldPortal.split(",")) {
    if (path.startsWith(prefix)) {
      /* HTML page */
      return true;
    }
  }

  return false;
}