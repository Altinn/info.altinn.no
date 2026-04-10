import type { IJSONTransformer } from "./IJSONTransformer";
import type { SchemaOverviewPageProps } from "@components/Pages/SchemaOverviewPage/SchemaOverviewPage.types";
import { fetchUmbracoAncestors, fetchUmbracoChildren } from "../api/umbraco/client";
import { BlockTransformer } from "./BlockTransformer";
import { BreadcrumbsTransformer } from "./BreadcrumbsTransformer";
import { t, type Locale } from "@i18n/index";

export class SchemaOverviewPageTransformer implements IJSONTransformer {
  public async Transform(cmsPageData: any, globalData?: any): Promise<any> {
    const props = cmsPageData.properties ?? {};    
    const ancestors = await fetchUmbracoAncestors(cmsPageData.route.path);
    const breadcrumb = BreadcrumbsTransformer.Transform(ancestors, cmsPageData);

    const providers = await fetchUmbracoChildren(cmsPageData.route.path);

    const providerCollections = providers.map((item: any) => ({
      // Fill in missing mapping here
        }));

    const categories = await fetchUmbracoChildren("7be52f06-4b7f-43e3-be3e-7871e56c27fc");

    const schemaCategories = categories.map((item: any) => ({
      // Fill in missing mapping here
        }));    

    const recommendedSchemas = props.recommendedSchemas.map((item: any) => ({
          pageName: item.name,
          url: item.route?.path,
          componentName: "RecommendedSchema"
        }));
    
    const locale: Locale = globalData?.locale || "nb";
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
