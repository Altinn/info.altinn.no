import { createDeliveryApiClient } from "@portals/umbraco-client";
import { env } from "cloudflare:workers";

export const UMBRACO_API_URL =
  env.UMBRACO_API_URL || "https://infoportal.at22.dis-core.altinn.cloud/";

const CULTURE_MAP: Record<string, string> = {
  nb: "nb",
  nn: "nn",
  en: "en",
};

const client = createDeliveryApiClient({
  baseUrl: UMBRACO_API_URL,
  defaultCulture: "nb",
});

function mapCulture(culture?: string): string | undefined {
  if (!culture) return undefined;
  return CULTURE_MAP[culture] ?? culture;
}

export async function fetchUmbracoContent(path: string, culture?: string) {
  return client.fetchItem(path, { culture: mapCulture(culture) });
}

export async function fetchUmbracoChildren(
  path: string,
  take = 100,
  culture?: string,
  sort?: string,
) {
  const data = await client.fetchCollection({
    fetch: `children:${path}`,
    take,
    sort,
    culture: mapCulture(culture),
  });
  return data.items ?? [];
}

export async function fetchUmbracoChildrenInEditorOrder(
  path: string,
  take = 100,
  culture?: string,
) {
  return fetchUmbracoChildren(path, take, culture, "sortOrder:asc");
}

export async function fetchUmbracoContentList(
  filters: string[],
  take = 100,
  culture?: string,
  sort?: string,
) {
  const data = await client.fetchCollection({
    filter: filters,
    take,
    sort,
    culture: mapCulture(culture),
  });
  return data.items ?? [];
}

export async function fetchUmbracoAncestors(path: string, culture?: string) {
  const data = await client.fetchCollection({
    fetch: `ancestors:${path}`,
    culture: mapCulture(culture),
  });
  return data.items ?? [];
}

export async function fetchUmbracoStartPage(locale?: string) {
  try {
    const data = await client.fetchCollection({
      filter: "contentType:startPage",
      take: 1,
      culture: locale,
    });
    return data.items?.[0] ?? null;
  } catch {
    return null;
  }
}

export async function fetchUmbracoRelated(
  path: string,
  contentType: string,
  relation: string,
  value: string,
  culture?: string,
) {
  const data = await client.fetchCollection({
    fetch: `descendants:${path}`,
    filter: [`contentType:${contentType}`, `${relation}:${value}`],
    fields: "",
    culture: mapCulture(culture),
  });
  return data.items ?? [];
}
