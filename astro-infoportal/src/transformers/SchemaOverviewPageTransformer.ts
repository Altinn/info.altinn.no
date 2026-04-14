import type { IJSONTransformer } from "./IJSONTransformer";
import type { SchemaOverviewPageProps } from "@components/Pages/SchemaOverviewPage/SchemaOverviewPage.types";
import { fetchUmbracoAncestors, fetchUmbracoChildren, fetchUmbracoContent } from "../api/umbraco/client";
import { BlockTransformer } from "./BlockTransformer";
import { BreadcrumbsTransformer } from "./BreadcrumbsTransformer";
import { t, type Locale } from "@i18n/index";

export class SchemaOverviewPageTransformer implements IJSONTransformer {
  private static normalize(name: string): string {
    return name.replace(/\s*\(.*?\)\s*/g, "").trim().toLowerCase();
  }

  public async Transform(cmsPageData: any, globalData?: any): Promise<any> {
    const props = cmsPageData.properties ?? {};    
    const locale: Locale = globalData?.locale || "nb";
    const ancestors = await fetchUmbracoAncestors(cmsPageData.route.path);
    const breadcrumb = BreadcrumbsTransformer.Transform(ancestors, cmsPageData);

    // --- Org icons from altinn CDN ---
    const orgIconByName: Record<string, string> = {};
    try {
      const orgsRes = await fetch("https://altinncdn.no/orgs/altinn-orgs.json");
      const orgsData = await orgsRes.json() as { orgs: Record<string, { name?: { nb?: string }; logo?: string }> };
      for (const org of Object.values(orgsData.orgs)) {
        const nb = org.name?.nb;
        const logo = org.logo;
        if (nb && logo) {
          orgIconByName[nb.trim().toLowerCase()] = logo;
          orgIconByName[SchemaOverviewPageTransformer.normalize(nb)] = logo;
        }
      }
    } catch {
      // If CDN fetch fails, icons will be empty strings
    }

    const resolveIcon = (name: string): string => {
      const lower = name.trim().toLowerCase();
      return orgIconByName[lower] || orgIconByName[SchemaOverviewPageTransformer.normalize(name)] || "";
    };

    // --- Categories ---
    const categories = await fetchUmbracoChildren("7be52f06-4b7f-43e3-be3e-7871e56c27fc");
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
    const rawProviders = await fetchUmbracoChildren(cmsPageData.route.path);
    const sortedProviders = rawProviders
      .map((item: any) => ({
        name: item.name,
        url: item.route?.path,
        imageUrl: resolveIcon(item.name),
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
    const providerByImportId: Record<string, { name: string; imageUrl: string; url: string }> = {};
    const providerBySlug: Record<string, { name: string; imageUrl: string; url: string }> = {};
    for (const p of rawProviders) {
      const info = {
        name: p.name,
        imageUrl: resolveIcon(p.name),
        url: p.route?.path || "",
      };
      if (p.properties?.importId != null) {
        providerByImportId[String(p.properties.importId)] = info;
      }
      const slug = p.route?.path?.split("/").filter(Boolean).pop();
      if (slug) {
        providerBySlug[slug] = info;
      }
    }

    // For each recommended schema, fetch full page to get providers string
    const recommendedSchemas = await Promise.all(
      (props.recommendedSchemas ?? []).map(async (item: any) => {
        const icons: { name: string; imageUrl: string; url: string }[] = [];
        try {
          const fullPage = await fetchUmbracoContent(item.route?.path);

          // Parent provider from route path (second segment after /skjemaoversikt/)
          const segments = fullPage.route?.path?.split("/").filter(Boolean) ?? [];
          const parentSlug = segments[1]; // e.g. "a-ordningen"
          if (parentSlug && providerBySlug[parentSlug]) {
            icons.push(providerBySlug[parentSlug]);
          }

          // Additional providers from comma-separated importId string
          const providersStr = fullPage.properties?.providers;
          if (typeof providersStr === "string" && providersStr.trim()) {
            for (const id of providersStr.split(",")) {
              const trimmed = id.trim();
              if (trimmed && providerByImportId[trimmed]) {
                icons.push(providerByImportId[trimmed]);
              }
            }
          }
        } catch {
          // If fetch fails, just show the schema without provider icons
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
