import { env } from "cloudflare:workers";

export const UMBRACO_API_URL =
  env.UMBRACO_API_URL || "https://infoportal.at22.dis-core.altinn.cloud/";

console.log("UMBRACO_API_URL in runtime:", UMBRACO_API_URL);

const CULTURE_MAP: Record<string, string> = {
  nb: "nb",
  nn: "nn",
  en: "en",
};

function cultureHeader(culture?: string): HeadersInit {
  const mapped = culture ? CULTURE_MAP[culture] ?? culture : "nb";
  return { "Accept-Language": mapped };
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function normalizeItemPath(path: string): string {
  const trimmed = path.replace(/^\/+|\/+$/g, "");
  return trimmed ? `/${trimmed}/` : "/";
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

export async function fetchUmbracoContent(path: string, culture?: string) {
  const url = deliveryUrl(
    `/umbraco/delivery/api/v2/content/item${normalizeItemPath(path)}`,
  );

  const response = await fetch(url, { headers: cultureHeader(culture) });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch from Umbraco: ${response.statusText} ${url}`,
    );
  }

  return await response.json();
}

export async function fetchUmbracoChildren(path: string, take = 100, culture?: string) {
  const params = new URLSearchParams({
    fetch: `children:${path}`,
    take: String(take),
  });
  const url = deliveryUrl("/umbraco/delivery/api/v2/content", params.toString());

  const response = await fetch(url, { headers: cultureHeader(culture) });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch children from Umbraco: ${response.statusText} ${url}`,
    );
  }

  const data = await response.json();
  return data.items ?? [];
}

export async function fetchUmbracoAncestors(path: string, culture?: string) {
  const params = new URLSearchParams({ fetch: `ancestors:${path}` });
  const url = deliveryUrl("/umbraco/delivery/api/v2/content", params.toString());

  const response = await fetch(url, { headers: cultureHeader(culture) });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch ancestors from Umbraco: ${response.statusText} ${url}`,
    );
  }

  const data = await response.json();
  return data.items ?? [];
}

export async function fetchUmbracoStartPage(locale?: string) {
  const params = new URLSearchParams({
    filter: "contentType:startPage",
    take: "1",
  });
  const url = deliveryUrl("/umbraco/delivery/api/v2/content", params.toString());

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
  culture?: string) {
  const params = new URLSearchParams();
  params.append("fetch", `descendants:${path}`);
  params.append("filter", `contentType:${contentType}`);
  params.append("filter", `${relation}:${value}`);
  params.append("fields", "");
  const url = deliveryUrl("/umbraco/delivery/api/v2/content", params.toString());

  const response = await fetch(url, { headers: cultureHeader(culture) });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch related content from Umbraco: ${response.statusText} ${url}`,
    );
  }

  const data = await response.json();
  return data.items ?? [];
}
