import { env } from "cloudflare:workers";

export const UMBRACO_API_URL =
  env.UMBRACO_API_URL || "https://infoportal.at22.dis-core.altinn.cloud/";

// Expand the banner + consentBanner pickers so their view models get the picked
// node's properties inline. Shared by the start-page fetches (front page, locale
// roots, sub-pages, 404, search) so the expand list lives in one place.
export const START_PAGE_EXPAND = "properties[banner,consentBanner]";

const CULTURE_MAP: Record<string, string> = {
  nb: "nb",
  nn: "nn",
  en: "en",
};

function getHeaders(culture?: string, isPreview?: boolean): HeadersInit {
  const headers:Headers = new Headers();
  const mapped = culture ? CULTURE_MAP[culture] ?? culture : "nb";

  headers.append("Accept-Language", mapped);

  if (isPreview) {
    headers.append("Api-Key", "no-secrets-here"); 
    headers.append("Preview", "true");
  }

  return headers;
}

// Editorial reality: NN and EN content trees frequently lag NB. When a
// non-NB request comes back missing-or-empty, retry the same URL with
// `Accept-Language: nb` so the user sees the NB content with localized
// chrome wrapped around it. NB requests never fall back further.
function shouldTryNbFallback(culture: string | undefined): boolean {
  return !!culture && culture !== "nb";
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

export function resolveUmbracoPublicUrl(baseUrl = UMBRACO_API_URL): string {
  const normalizedBaseUrl = trimTrailingSlash(baseUrl);
  const url = new URL(normalizedBaseUrl);
  const host = url.hostname.toLowerCase();
  const envMatch = host.match(/^infoportal\.(at\d+)\.dis-core\.altinn\.cloud$/);

  if (envMatch) {
    return `https://info.${envMatch[1]}.altinn.cloud/`;
  }

  if (host === "infoportal.prod.dis-core.altinn.cloud") {
    return "https://info.altinn.no/";
  }

  return `${url.origin}/`;
}

function normalizeItemPath(path: string): string {
  const trimmed = path.replace(/^\/+|\/+$/g, "");
  return trimmed ? `/${trimmed}/` : "/";
}

function normalizeDeliveryPath(path: string): string {
  return path.replace(/-{2,}/g, "-");
}

function deliveryUrl(pathname: string, search?: string): string {
  const url = new URL(
    `${trimTrailingSlash(UMBRACO_API_URL)}${pathname}`,
  );
  if (search) {
    url.search = search;
  }
  return url.toString();
}

export async function fetchUmbracoContent(
  path: string,
  culture?: string,
  expand?: string,
  isPreview?: boolean,
) {
  const url = deliveryUrl(
    `/umbraco/delivery/api/v2/content/item${normalizeDeliveryPath(normalizeItemPath(path))}`,
    expand ? new URLSearchParams({ expand }).toString() : undefined,
  );

  let response = await fetch(url, { headers: getHeaders(culture, isPreview) });

  if (response.status === 404 && shouldTryNbFallback(culture)) {
    response = await fetch(url, { headers: getHeaders("nb", isPreview) });
  }

  if (!response.ok) {
    throw new Error(
      `Failed to fetch from Umbraco: ${response.statusText} ${url}`,
    );
  }

  return await response.json();
}

/**
 * Fetch a content item with locale fallback to bokmål.
 *
 * If a request for /{nn|en}/... 404s, retry once with the locale prefix
 * stripped and Accept-Language: nb. This matches the editorial expectation
 * that untranslated pages render their NB content while the surrounding
 * chrome stays in the requested locale.
 */
export async function fetchUmbracoContentWithLocaleFallback(
  path: string,
  culture?: string,
  expand?: string,
  isPreview?: boolean
) {
  try {
    return await fetchUmbracoContent(path, culture, expand, isPreview);
  } catch (error) {
    if (culture && culture !== "nb") {
      const normalized = normalizeItemPath(path);
      const prefix = `/${culture}/`;
      if (normalized.startsWith(prefix)) {
        const fallbackPath = normalized.slice(prefix.length - 1) || "/";
        return await fetchUmbracoContent(fallbackPath, "nb", expand, isPreview);
      }
    }
    throw error;
  }
}

export async function fetchUmbracoContentById(id: string, culture?: string, isPreview?: boolean) {
  const url = deliveryUrl(
    `/umbraco/delivery/api/v2/content/item/${encodeURIComponent(id)}`,
  );

  let response = await fetch(url, { headers: getHeaders(culture, isPreview) });

  if (response.status === 404 && shouldTryNbFallback(culture)) {
    response = await fetch(url, { headers: getHeaders("nb", isPreview) });
  }

  if (!response.ok) {
    return null;
  }

  return await response.json();
}

/**
 * Resolves an array of Content Picker references into fully-populated content objects.
 * If a ref already has populated `properties`, it's returned as-is. Otherwise we try
 * `route.path` first, then fall back to `id` (necessary when the ref points to content
 * under a different startItem — path resolution fails there).
 */
export async function resolveBlockReferences(
  refs: any[] | { items?: any[] } | undefined | null,
  locale?: string,
  isPreview?: boolean,
): Promise<any[]> {
  const items: any[] = Array.isArray(refs)
    ? refs
    : Array.isArray((refs as any)?.items)
      ? (refs as any).items
      : [];
  return Promise.all(
    items.map(async (item) => {
      if (item?.properties && Object.keys(item.properties).length > 0) {
        return item;
      }
      const route = item?.route?.path;
      if (route) {
        try {
          return await fetchUmbracoContent(route, locale, undefined, isPreview);
        } catch {
          // cross-startItem reference — fall through to id-based fetch
        }
      }
      if (item?.id) {
        try {
          return (await fetchUmbracoContentById(item.id, locale, isPreview)) ?? item;
        } catch {
          return item;
        }
      }
      return item;
    }),
  );
}

export async function fetchUmbracoChildren(
  path: string,
  take = 100,
  culture?: string,
  sort?: string,
  isPreview?: boolean
) {
  const params = new URLSearchParams({
    fetch: `children:${normalizeDeliveryPath(path)}`,
    take: String(take),
  });
  if (sort) {
    params.append("sort", sort);
  }
  const url = deliveryUrl("/umbraco/delivery/api/v2/content", params.toString());

  const response = await fetch(url, { headers: getHeaders(culture, isPreview) });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch children from Umbraco: ${response.statusText} ${url}`,
    );
  }

  const data = await response.json();
  const items = data.items ?? [];

  if (items.length === 0 && shouldTryNbFallback(culture)) {
    const nbResponse = await fetch(url, { headers: getHeaders("nb", isPreview) });
    if (nbResponse.ok) {
      const nbData = await nbResponse.json();
      return nbData.items ?? [];
    }
  }

  return items;
}

export async function fetchUmbracoChildrenInEditorOrder(
  path: string,
  take = 100,
  culture?: string,
  isPreview?: boolean
) {
  return fetchUmbracoChildren(path, take, culture, "sortOrder:asc", isPreview);
}

export async function fetchUmbracoContentList(
  filters: string[],
  take = 100,
  culture?: string,
  sort?: string,
  isPreview?: boolean,
) {
  const params = new URLSearchParams({
    take: String(take),
  });
  filters.forEach((filter) => params.append("filter", filter));
  if (sort) {
    params.append("sort", sort);
  }
  const url = deliveryUrl("/umbraco/delivery/api/v2/content", params.toString());

  const response = await fetch(url, { headers: getHeaders(culture, isPreview) });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch content list from Umbraco: ${response.statusText} ${url}`,
    );
  }

  const data = await response.json();
  const items = data.items ?? [];

  if (items.length === 0 && shouldTryNbFallback(culture)) {
    const nbResponse = await fetch(url, { headers: getHeaders("nb", isPreview) });
    if (nbResponse.ok) {
      const nbData = await nbResponse.json();
      return nbData.items ?? [];
    }
  }

  return items;
}

export async function fetchUmbracoContentListPage(
  filters: string[],
  take = 100,
  skip = 0,
  culture?: string,
  sort?: string,
  fields?: string,
  isPreview?: boolean
) {
  const params = new URLSearchParams({
    take: String(take),
    skip: String(skip),
  });
  filters.forEach((filter) => params.append("filter", filter));
  if (sort) {
    params.append("sort", sort);
  }
  if (fields !== undefined) {
    params.append("fields", fields);
  }
  const url = deliveryUrl("/umbraco/delivery/api/v2/content", params.toString());

  const response = await fetch(url, { headers: getHeaders(culture, isPreview) });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch content list page from Umbraco: ${response.statusText} ${url}`,
    );
  }

  const data = await response.json();
  const items = data.items ?? [];
  const total = data.total ?? 0;

  if (items.length === 0 && shouldTryNbFallback(culture)) {
    const nbResponse = await fetch(url, { headers: getHeaders("nb", isPreview) });
    if (nbResponse.ok) {
      const nbData = await nbResponse.json();
      return {
        total: nbData.total ?? 0,
        items: nbData.items ?? [],
      };
    }
  }

  return { total, items };
}

export async function fetchUmbracoAncestors(path: string, culture?: string, isPreview?: boolean) {
  const params = new URLSearchParams({ fetch: `ancestors:${normalizeDeliveryPath(path)}` });
  const url = deliveryUrl("/umbraco/delivery/api/v2/content", params.toString());

  const response = await fetch(url, { headers: getHeaders(culture, isPreview) });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch ancestors from Umbraco: ${response.statusText} ${url}`,
    );
  }

  const data = await response.json();
  const items = data.items ?? [];

  if (items.length === 0 && shouldTryNbFallback(culture)) {
    const nbResponse = await fetch(url, { headers: getHeaders("nb", isPreview) });
    if (nbResponse.ok) {
      const nbData = await nbResponse.json();
      return nbData.items ?? [];
    }
  }

  return items;
}

export async function fetchUmbracoStartPage(locale?: string, isPreview?: boolean) {
  const params = new URLSearchParams({
    filter: "contentType:startPage",
    take: "1",
    // expand the banner and consentBanner pickers so the view models get the node's properties inline
    expand: START_PAGE_EXPAND,
  });
  const url = deliveryUrl("/umbraco/delivery/api/v2/content", params.toString());

  const response = await fetch(url, { headers: getHeaders(locale, isPreview) });
  if (response.ok) {
    const data = await response.json();
    const item = data.items?.[0];
    if (item) return item;
  }

  if (shouldTryNbFallback(locale)) {
    const nbResponse = await fetch(url, { headers: getHeaders("nb", isPreview) });
    if (nbResponse.ok) {
      const nbData = await nbResponse.json();
      return nbData.items?.[0] ?? null;
    }
  }

  return null;
}

export async function fetchUmbracoErrorPage(locale?: string) {
  const params = new URLSearchParams({
    filter: "contentType:error404Page",
    take: "1",
  });
  const url = deliveryUrl("/umbraco/delivery/api/v2/content", params.toString());

  const response = await fetch(url, { headers: getHeaders(locale) });
  if (response.ok) {
    const data = await response.json();
    const item = data.items?.[0];
    if (item) return item;
  }

  if (shouldTryNbFallback(locale)) {
    const nbResponse = await fetch(url, { headers: getHeaders("nb") });
    if (nbResponse.ok) {
      const nbData = await nbResponse.json();
      return nbData.items?.[0] ?? null;
    }
  }

  return null;
}

export async function fetchUmbracoRelated(
  path: string,
  contentType: string,
  relation: string,
  value: string,
  culture?: string) {
  const params = new URLSearchParams();
  params.append("fetch", `descendants:${normalizeDeliveryPath(path)}`);
  params.append("filter", `contentType:${contentType}`);
  params.append("filter", `${relation}:${value}`);
  params.append("fields", "");
  params.append("take", "300");
  const url = deliveryUrl("/umbraco/delivery/api/v2/content", params.toString());

  const response = await fetch(url, { headers: getHeaders(culture) });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch related content from Umbraco: ${response.statusText} ${url}`,
    );
  }

  const data = await response.json();
  const items = data.items ?? [];

  if (items.length === 0 && shouldTryNbFallback(culture)) {
    const nbResponse = await fetch(url, { headers: getHeaders("nb") });
    if (nbResponse.ok) {
      const nbData = await nbResponse.json();
      return nbData.items ?? [];
    }
  }

  return items;
}

export async function fetchUmbracoMedia(path: string) {
  // Transitioning from old cms media structure */
  path = path.replace("/publicassets/", "/media/");
  path = path.replace("/contentassets/", "/media/");
  if (path.startsWith("/")) {
    path = path.substring(1);
  }
  const url = `${env.UMBRACO_API_URL}${path}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch media from Umbraco: ${response.statusText} ${url}`);
  }

  return await response.bytes();
}

export async function fetchUmbracoRedirect(path: string) {
  const url = `${env.UMBRACO_API_URL}api/redirect?path=${path}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch redirect from Umbraco: ${response.statusText} ${url}`);
  }
  
  const text = await response.text();
  return text.length > 0 ? text : null;
}


