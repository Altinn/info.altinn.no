import type { IJSONTransformer } from "./IJSONTransformer";
import type { SubsidyOverviewPageProps } from "@components/Pages/SubsidyOverviewPage/SubsidyOverviewPage.types";

export class SubsidyOverviewPageTransformer implements IJSONTransformer {
  public async Transform(cmsPageData: any): Promise<SubsidyOverviewPageProps> {
    return {
      componentName: "SubsidyOverviewPage",
      pageName: cmsPageData.name,
      mainIntro: cmsPageData.properties.mainIntro || undefined,
      maxItems: cmsPageData.properties.maxItems || 0,
      subsidyApiUrl: cmsPageData.properties.subsidyApiUrl || undefined,
      breadcrumb: cmsPageData.properties.breadcrumb || undefined,
      translations: cmsPageData.properties.translations || undefined,
      ...cmsPageData.properties,
    };
  }
}
