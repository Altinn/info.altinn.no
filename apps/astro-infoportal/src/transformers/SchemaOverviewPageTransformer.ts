import type { IJSONTransformer } from "./IJSONTransformer";
import { fetchUmbracoAncestors, fetchUmbracoChildren, fetchUmbracoContent } from "../api/umbraco/client";
import { BreadcrumbsTransformer } from "./BreadcrumbsTransformer";
import { t, type Locale } from "@i18n/index";
import { buildOrgLookup, normalizeName, resolveProviderIcon } from "./providerUtils";

function getParentProviderSlug(schemaPath?: string, overviewPath?: string): string | null {
  const schemaSegments = schemaPath?.split("/").filter(Boolean) ?? [];
  const overviewSegments = overviewPath?.split("/").filter(Boolean) ?? [];
  const providerSlug = schemaSegments[overviewSegments.length];
  return providerSlug || null;
}

type ProviderInfo = { name: string; imageUrl: string; url: string };
type ProviderLookup = Record<string, ProviderInfo>;

const PARENT_PROVIDER_FALLBACK_SLUGS: Record<string, string[]> = {
  "a-ordningen": [
    "skatteetaten",
    "arbeids-og-velferdsetaten-nav",
    "statistisk-sentralbyra",
    "a-ordningen",
  ],
  "the-a-ordning": [
    "tax-administration",
    "labour-and-welfare-service-nav",
    "statistics-norway-ssb",
    "the-a-ordning",
  ],
};

function addProviderOnce(providers: ProviderInfo[], provider?: ProviderInfo) {
  if (!provider) return;
  const normalize = (value: string) => value.trim().toLowerCase();
  const exists = providers.some(
    (p) => p.url === provider.url || normalize(p.name) === normalize(provider.name),
  );
  if (!exists) providers.push(provider);
}

function addProvidersBySlug(
  providers: ProviderInfo[],
  providerBySlug: ProviderLookup,
  slugs: string[],
) {
  for (const slug of slugs) {
    addProviderOnce(providers, providerBySlug[slug]);
  }
}

export class SchemaOverviewPageTransformer implements IJSONTransformer {
  private static normalize(name: string): string {
    return normalizeName(name);
  }

  public async Transform(cmsPageData: any, globalData?: any): Promise<any> {
    const props = cmsPageData.properties ?? {};    
    const locale: Locale = globalData?.locale || "nb";
    const ancestors = await fetchUmbracoAncestors(cmsPageData.route.path, locale);
    const breadcrumb = BreadcrumbsTransformer.Transform(ancestors, cmsPageData);

    // --- Org icons from altinn CDN ---
    let orgLookup = buildOrgLookup({});
    try {
      const orgsRes = await fetch("https://altinncdn.no/orgs/altinn-orgs.json");
      const orgsData = await orgsRes.json() as { orgs: Record<string, { name?: Record<string, string>; logo?: string }> };
      orgLookup = buildOrgLookup(orgsData.orgs);
    } catch {
      // If CDN fetch fails, icons will be empty strings
    }

    // --- Categories ---
    let categories = await fetchUmbracoChildren("7be52f06-4b7f-43e3-be3e-7871e56c27fc", 100, locale);
    if (categories.length === 0 && locale !== "nb") {
      categories = await fetchUmbracoChildren("7be52f06-4b7f-43e3-be3e-7871e56c27fc");
    }
    const schemaCategories = categories
      .map((item: any) => ({
        category: item.name,
        url: item.route?.path,
        icon: item.properties?.icon,
      }))
      .sort((a: any, b: any) =>
        a.category.localeCompare(b.category, locale, { sensitivity: "base" }),
      );

    // --- Providers ---
    const rawProviders = await fetchUmbracoChildren(cmsPageData.route.path, 100, locale);
    const providers = await Promise.all(
      rawProviders.map(async (provider: any) => {
        const path = provider.route?.path;
        if (!path) return provider;
        try {
          return await fetchUmbracoContent(path, locale);
        } catch {
          return provider;
        }
      }),
    );

    const sortedProviders = providers
      .map((item: any) => ({
        name: item.name,
        url: item.route?.path,
        imageUrl: resolveProviderIcon(item, orgLookup),
      }))
      .sort((a: any, b: any) =>
        a.name.localeCompare(b.name, locale, { sensitivity: "base" }),
      );

    const providerCollections = Object.values(
      sortedProviders.reduce((groups: Record<string, { letter: string; providers: any[] }>, provider: any) => {
        const letter = (provider.name?.[0] || "#").toUpperCase();
        if (!groups[letter]) {
          groups[letter] = { letter, providers: [] };
        }
        groups[letter].providers.push(provider);
        return groups;
      }, {}),
    ).sort((a: any, b: any) => a.letter.localeCompare(b.letter, locale));

    // --- Recommended Schemas ---
    // Build lookup maps from rawProviders for resolving provider references
    const providerByImportId: ProviderLookup = {};
    const providerBySlug: ProviderLookup = {};
    for (const p of providers) {
      const info = {
        name: p.name,
        imageUrl: resolveProviderIcon(p, orgLookup),
        url: p.route?.path || "",
      };
      const providerId = p.properties?.providerId ?? p.properties?.importId;
      if (providerId != null) {
        providerByImportId[String(providerId)] = info;
      }
      const slug = p.route?.path?.split("/").filter(Boolean).pop();
      if (slug) {
        providerBySlug[slug] = info;
      }
    }

    // For each recommended schema, fetch full page to get providers string
    const recommendedSchemas = await Promise.all(
      (props.recommendedSchemas ?? []).map(async (item: any) => {
        const icons: ProviderInfo[] = [];
        const parentSlug = getParentProviderSlug(
          item.route?.path,
          cmsPageData.route?.path,
        );

        try {
          const fullPage = await fetchUmbracoContent(item.route?.path, locale);

          // Additional providers from comma-separated importId string
          const providersStr = fullPage.properties?.providers;
          if (typeof providersStr === "string" && providersStr.trim()) {
            for (const id of providersStr.split(",")) {
              const trimmed = id.trim();
              if (trimmed) addProviderOnce(icons, providerByImportId[trimmed]);
            }
          }
        } catch {
          // If fetch fails, just show the schema without provider icons
        }

        if (icons.length === 0 && parentSlug) {
          addProvidersBySlug(
            icons,
            providerBySlug,
            PARENT_PROVIDER_FALLBACK_SLUGS[parentSlug] ?? [parentSlug],
          );
        }

        return {
          pageName: item.name,
          url: item.route?.path,
          providerIcons: icons,
          componentName: "RecommendedSchema",
        };
      }),
    );
    
    return {
      componentName: "SchemaOverviewPage",
      renderAlternateHeader: props.renderAlternateHeader || false,
      title: props.title || undefined,
      suggestions: props.suggestions || undefined,
      breadcrumb: breadcrumb,
      schemaCategories: schemaCategories,
      providerCollections: providerCollections,
      agencyText: t("schemaOverview.agency", locale),
      servicesText: t("schemaOverview.allServices", locale),
      providersText: t("schemaOverview.allProviders", locale),
      recommendedSchemasHeaderText: t("schemaOverview.recommendedSchemas", locale),
      recommendedSchemas: recommendedSchemas,
      initialTab: cmsPageData.properties.initialTab || undefined
    };
  }
}
