import { type Locale, t } from "@i18n/index";
import {
  type ProviderInfo,
  ProviderResolver,
} from "@services/Providers/ProviderResolver";
import {
  fetchUmbracoAncestors,
  fetchUmbracoChildren,
  fetchUmbracoContent,
  resolveBlockReferences,
} from "../api/umbraco/client";
import { BreadcrumbsTransformer } from "./BreadcrumbsTransformer";
import type { IJSONTransformer } from "./IJSONTransformer";

export class SchemaOverviewPageTransformer implements IJSONTransformer {
  public async Transform(cmsPageData: any, globalData?: any): Promise<any> {
    const props = cmsPageData.properties ?? {};
    const locale: Locale = globalData?.locale || "nb";
    const resolver = await ProviderResolver.create();

    const ancestors = await fetchUmbracoAncestors(
      cmsPageData.route.path,
      locale,
    );
    const breadcrumb = BreadcrumbsTransformer.Transform(ancestors, cmsPageData);

    let categories = await fetchUmbracoChildren(
      "7be52f06-4b7f-43e3-be3e-7871e56c27fc",
      100,
      locale,
    );
    if (categories.length === 0 && locale !== "nb") {
      categories = await fetchUmbracoChildren(
        "7be52f06-4b7f-43e3-be3e-7871e56c27fc",
      );
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

    const providers = await fetchUmbracoChildren(
      cmsPageData.route.path,
      100,
      locale,
    );

    const sortedProviders = providers
      .map((item: any) => ({
        name: item.name,
        url: item.route?.path,
        imageUrl: resolver.resolveImageUrl(
          item.properties?.providerAcronym,
          item.properties?.providerOrgNr,
          item.name ?? "",
          locale,
        ),
      }))
      .sort((a: any, b: any) =>
        a.name.localeCompare(b.name, locale, { sensitivity: "base" }),
      );

    const providerCollections = Object.values(
      sortedProviders.reduce(
        (
          groups: Record<string, { letter: string; providers: any[] }>,
          provider: any,
        ) => {
          const letter = (provider.name?.[0] || "#").toUpperCase();
          if (!groups[letter]) {
            groups[letter] = { letter, providers: [] };
          }
          groups[letter].providers.push(provider);
          return groups;
        },
        {},
      ),
    ).sort((a: any, b: any) => a.letter.localeCompare(b.letter, locale));

    const recommendedSchemas = await Promise.all(
      (props.recommendedSchemas ?? []).map(async (item: any) => {
        let icons: ProviderInfo[] = [];
        try {
          const fullPage = await fetchUmbracoContent(item.route?.path, locale);
          const resolvedRefs = await resolveBlockReferences(
            fullPage.properties?.providers,
            locale,
          );
          icons = resolvedRefs.map((ref: any) => {
            const name = ref?.name ?? "";
            return {
              name,
              imageUrl: resolver.resolveImageUrl(
                ref?.properties?.providerAcronym,
                ref?.properties?.providerOrgNr,
                name,
                locale,
              ),
              url: ref?.route?.path ?? "",
            };
          });
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
      recommendedSchemasHeaderText: t(
        "schemaOverview.recommendedSchemas",
        locale,
      ),
      recommendedSchemas: recommendedSchemas,
      initialTab: cmsPageData.properties.initialTab || undefined,
      searchPageUrl: t("search.pageUrl", locale),
      searchPlaceholder: t("search.searchAfterSchemaContent", locale),
      searchAriaLabel: t("search.ariaLabel", locale),
    };
  }
}
