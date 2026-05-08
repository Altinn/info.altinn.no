import { resolveRouteOverride } from "../../Constants/routeOverrides";
import { fetchUmbracoContentListPage } from "./client";

type SitemapLocale = "nb" | "nn" | "en";

type UmbracoRoute = {
  path?: string;
  queryString?: string | null;
};

type UmbracoSitemapItem = {
  id: string;
  contentType: string;
  updateDate?: string;
  route?: UmbracoRoute;
  cultures?: Partial<Record<SitemapLocale, UmbracoRoute>>;
};

type SitemapUrl = {
  loc: string;
  lastmod?: string;
  locale: SitemapLocale;
  alternates: Partial<Record<SitemapLocale, string>>;
};

type SitemapCacheEntry = {
  expiresAt: number;
  xmlPromise: Promise<string>;
};

const SITEMAP_PAGE_SIZE = 500;
const SITEMAP_CACHE_TTL_MS = 60 * 60 * 1000;
const sitemapXmlCache = new Map<string, SitemapCacheEntry>();

const SITEMAP_CONTENT_TYPES = [
  "startPage",
  "sectionPage",
  "sectionArticlePage",
  "themePage",
  "schemaOverviewPage",
  "providerPage",
  "schemaPage",
  "categoryPage",
  "subCategoryPage",
  "subsidyOverviewPage",
  "subsidyPage",
  "newsArchivePage",
  "newsArticlePage",
  "operationalMessageArchivePage",
  "operationalMessageArticlePage",
  "helpStartPage",
  "helpLandingPage",
  "helpDrilldownPage",
  "contactFormPage",
] as const;

const SITEMAP_LOCALES: SitemapLocale[] = ["nb", "nn", "en"];

const EXCLUDED_PATHS = new Set([
  "/sok/",
  "/nn/sok/",
  "/en/search/",
]);

const EXCLUDED_PATH_SEGMENTS = [
  "/sideblokker/",
  "/a-ordningen/",
  "/eksterne-linker/",
  "/eksterne-lenker/",
  "/eksterne-lenker-a-ordningen/",
  "/skjulte-driftsmeldinger/",
  "/sporsmal-og-svar-gammel/",
  "/sporsmal-og-svar-old/",
  "/faq-old/",
];

const EXCLUDED_PATH_PATTERNS = [
  /new-page\d*\//,
  /\/(?:nn\/|en\/)?skjemaoversikt\/[^/]+\/testtjeneste-[^/]+\//,
];

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function normalizePath(path?: string): string | null {
  if (!path || !path.startsWith("/")) {
    return null;
  }

  const [pathname] = path.split("?", 1);
  const normalizedPathname = pathname.endsWith("/") ? pathname : `${pathname}/`;
  const overridden = resolveRouteOverride(normalizedPathname) ?? normalizedPathname;
  const [overriddenPathname] = overridden.split("?", 1);
  const normalizedOverride = overriddenPathname.endsWith("/")
    ? overriddenPathname
    : `${overriddenPathname}/`;

  if (EXCLUDED_PATHS.has(normalizedOverride)) {
    return null;
  }

  if (EXCLUDED_PATH_SEGMENTS.some((segment) => normalizedOverride.includes(segment))) {
    return null;
  }

  if (EXCLUDED_PATH_PATTERNS.some((pattern) => pattern.test(normalizedOverride))) {
    return null;
  }

  return normalizedOverride;
}

function toAbsoluteUrl(baseUrl: string, path: string): string {
  return new URL(path, baseUrl).toString();
}

function toLastModified(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date.toISOString();
}

async function fetchAllItemsForContentType(contentType: string): Promise<UmbracoSitemapItem[]> {
  const filters = [`contentType:${contentType}`];
  const firstPage = await fetchUmbracoContentListPage(
    filters,
    SITEMAP_PAGE_SIZE,
    0,
    "nb",
    undefined,
    "",
  );

  if (firstPage.total <= SITEMAP_PAGE_SIZE) {
    return firstPage.items;
  }

  const remainingPagePromises = [];
  for (let skip = SITEMAP_PAGE_SIZE; skip < firstPage.total; skip += SITEMAP_PAGE_SIZE) {
    remainingPagePromises.push(
      fetchUmbracoContentListPage(filters, SITEMAP_PAGE_SIZE, skip, "nb", undefined, ""),
    );
  }

  const remainingPages = await Promise.all(remainingPagePromises);
  return [firstPage, ...remainingPages].flatMap((page) => page.items);
}

async function fetchAllSitemapItems(): Promise<UmbracoSitemapItem[]> {
  const itemGroups: UmbracoSitemapItem[][] = [];
  let failedContentTypes = 0;

  const results = await Promise.all(
    SITEMAP_CONTENT_TYPES.map(async (contentType) => {
      try {
        return {
          contentType,
          items: await fetchAllItemsForContentType(contentType),
          status: "fulfilled" as const,
        };
      } catch (error) {
        return {
          contentType,
          error,
          status: "rejected" as const,
        };
      }
    }),
  );

  for (const result of results) {
    if (result.status === "fulfilled") {
      itemGroups.push(result.items);
    } else {
      failedContentTypes += 1;
      console.error(`Failed to fetch sitemap items for content type ${result.contentType}`, result.error);
    }
  }

  if (failedContentTypes === SITEMAP_CONTENT_TYPES.length) {
    throw new Error("Failed to fetch sitemap items from Umbraco Delivery API.");
  }

  return itemGroups.flat();
}

function getSitemapCacheKey(publicBaseUrl: string, requestedLocale?: SitemapLocale): string {
  return `${publicBaseUrl.replace(/\/+$/, "")}|${requestedLocale ?? "all"}`;
}

function buildSitemapUrls(
  items: UmbracoSitemapItem[],
  publicBaseUrl: string,
  requestedLocale?: SitemapLocale,
): SitemapUrl[] {
  const urlsByLocation = new Map<string, SitemapUrl>();

  for (const item of items) {
    const cultureRoutes = item.cultures ?? {};
    const alternates: Partial<Record<SitemapLocale, string>> = {};

    for (const locale of SITEMAP_LOCALES) {
      const route = cultureRoutes[locale] ?? (locale === "nb" ? item.route : undefined);
      const path = normalizePath(route?.path);
      if (!path) {
        continue;
      }

      alternates[locale] = toAbsoluteUrl(publicBaseUrl, path);
    }

    for (const locale of SITEMAP_LOCALES) {
      if (requestedLocale && locale !== requestedLocale) {
        continue;
      }

      const loc = alternates[locale];
      if (!loc) {
        continue;
      }

      urlsByLocation.set(loc, {
        loc,
        lastmod: toLastModified(item.updateDate),
        locale,
        alternates,
      });
    }
  }

  return [...urlsByLocation.values()].sort((left, right) => left.loc.localeCompare(right.loc));
}

async function generateSitemapXmlUncached(
  publicBaseUrl: string,
  requestedLocale?: SitemapLocale,
): Promise<string> {
  const items = await fetchAllSitemapItems();
  const urls = buildSitemapUrls(items, publicBaseUrl, requestedLocale);
  const xmlUrls = urls.map((url) => {
    const alternates = SITEMAP_LOCALES
      .map((locale) => {
        const href = url.alternates[locale];
        if (!href) {
          return "";
        }

        const hreflang = locale === "nb" ? "nb-no" : locale;
        return `    <xhtml:link rel="alternate" hreflang="${hreflang}" href="${escapeXml(href)}" />`;
      })
      .filter(Boolean)
      .join("\n");

    return [
      "  <url>",
      `    <loc>${escapeXml(url.loc)}</loc>`,
      url.lastmod ? `    <lastmod>${escapeXml(url.lastmod)}</lastmod>` : "",
      alternates,
      "  </url>",
    ].filter(Boolean).join("\n");
  }).join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    xmlUrls,
    '</urlset>',
  ].filter(Boolean).join("\n");
}

export async function generateSitemapXml(
  publicBaseUrl: string,
  requestedLocale?: SitemapLocale,
): Promise<string> {
  const cacheKey = getSitemapCacheKey(publicBaseUrl, requestedLocale);
  const now = Date.now();
  const cached = sitemapXmlCache.get(cacheKey);

  if (cached && cached.expiresAt > now) {
    return cached.xmlPromise;
  }

  const xmlPromise = generateSitemapXmlUncached(publicBaseUrl, requestedLocale);
  sitemapXmlCache.set(cacheKey, {
    expiresAt: now + SITEMAP_CACHE_TTL_MS,
    xmlPromise,
  });

  try {
    return await xmlPromise;
  } catch (error) {
    if (sitemapXmlCache.get(cacheKey)?.xmlPromise === xmlPromise) {
      sitemapXmlCache.delete(cacheKey);
    }

    throw error;
  }
}

export function parseSitemapLocale(value?: string): SitemapLocale | undefined {
  if (value === "nb" || value === "nn" || value === "en") {
    return value;
  }

  return undefined;
}