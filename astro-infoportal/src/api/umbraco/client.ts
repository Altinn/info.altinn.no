import { env } from "cloudflare:workers";

export const UMBRACO_API_URL =
  env.UMBRACO_API_URL || "https://infoportal.at22.dis-core.altinn.cloud/";

export async function fetchUmbracoContent(path: string) {
  // Uses Umbraco Content Delivery API pattern
  const url = `${UMBRACO_API_URL}/umbraco/delivery/api/v2/content/item/${path}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch from Umbraco: ${response.statusText} ${url}`,
    );
  }

  return await response.json();
}

export async function fetchUmbracoChildren(path: string, take = 100) {
  const url = `${UMBRACO_API_URL}/umbraco/delivery/api/v2/content?fetch=children:${path}&take=${take}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch children from Umbraco: ${response.statusText} ${url}`,
    );
  }

  const data = await response.json();
  return data.items ?? [];
}

export async function fetchUmbracoAncestors(path: string) {
  const url = `${UMBRACO_API_URL}/umbraco/delivery/api/v2/content?fetch=ancestors:${path}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch ancestors from Umbraco: ${response.statusText} ${url}`,
    );
  }

  const data = await response.json();
  return data.items ?? [];
}

export async function fetchUmbracoStartPage(locale?: string) {
  const url = `${UMBRACO_API_URL}/umbraco/delivery/api/v2/content?filter=contentType:startPage&take=1`;

  const headers: Record<string, string> = {};
  if (locale) headers["Accept-Language"] = locale;

  const response = await fetch(url, { headers });

  if (!response.ok) return null;

  const data = await response.json();
  return data.items?.[0] ?? null;
}

export async function fetchUmbracoRelated(
  path: string,
  contentType: string,
  relation: string,
  value: string,
) {
  const url = `${UMBRACO_API_URL}/umbraco/delivery/api/v2/content?fetch=descendants:${path}&filter=contentType:${contentType}&filter=${relation}:${value}&fields=`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch related content from Umbraco: ${response.statusText} ${url}`,
    );
  }

  const data = await response.json();
  return data.items ?? [];
}
