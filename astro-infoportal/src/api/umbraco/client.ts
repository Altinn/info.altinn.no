export const UMBRACO_API_URL = import.meta.env.UMBRACO_API_URL || 'http://localhost:43450';

export async function fetchUmbracoContent(path: string) {
    // Uses Umbraco Content Delivery API pattern
    const url = `${UMBRACO_API_URL}/umbraco/delivery/api/v2/content/item/${path}`;
    const headers: HeadersInit = {
        'Accept-Language': 'nb-NO', // Default to Norwegian
    };

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch from Umbraco: ${response.statusText} ${url}`);
  }

  return await response.json();
}