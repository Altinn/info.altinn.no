import type { IJSONTransformer } from "./IJSONTransformer";
import type { SchemaOverviewPageProps } from "@components/Pages/SchemaOverviewPage/SchemaOverviewPage.types";

export class SchemaOverviewPageTransformer implements IJSONTransformer {
  public async Transform(cmsPageData: any): Promise<SchemaOverviewPageProps> {
    return {
      componentName: "SchemaOverviewPage",
      renderAlternateHeader: cmsPageData.properties.renderAlternateHeader || false,
      title: cmsPageData.properties.title || undefined,
      suggestions: cmsPageData.properties.suggestions || undefined,
      breadcrumb: cmsPageData.properties.breadcrumb || undefined,
      schemaCategories: cmsPageData.properties.schemaCategories || [],
      providerCollections: cmsPageData.properties.providerCollections || [],
      agencyText: cmsPageData.properties.agencyText || undefined,
      servicesText: cmsPageData.properties.servicesText || undefined,
      providersText: cmsPageData.properties.providersText || undefined,
      recommendedSchemasHeaderText: cmsPageData.properties.recommendedSchemasHeaderText || undefined,
      recommendedSchemas: cmsPageData.properties.recommendedSchemas || [],
      initialTab: cmsPageData.properties.initialTab || undefined,
      ...cmsPageData.properties,
    };
  }
}
