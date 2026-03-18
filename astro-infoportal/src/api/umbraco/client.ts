import { env } from "cloudflare:workers";

export const UMBRACO_API_URL = env.UMBRACO_API_URL || 'http://localhost:43450';

export async function fetchUmbracoContent(path: string) {
    // Uses Umbraco Content Delivery API pattern
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    const url = `${UMBRACO_API_URL}/umbraco/delivery/api/v2/content/item/${cleanPath}`;
    const headers: HeadersInit = {
        'Accept-Language': 'nb', // Default to Norwegian
    };

  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(`Failed to fetch from Umbraco: ${response.statusText} ${url}`);
  }

  return await response.json();
}

export async function fetchUmbracoChildren(id: string) {
  const url = `${UMBRACO_API_URL}/umbraco/delivery/api/v2/content?fetch=children:${id}`;
  const headers: HeadersInit = {
    'Accept-Language': 'nb',
  };

  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(`Failed to fetch children from Umbraco: ${response.statusText} ${url}`);
  }

  const data = await response.json();
  return data.items ?? [];
}