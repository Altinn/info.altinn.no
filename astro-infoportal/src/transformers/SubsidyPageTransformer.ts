import type { SubsidyPageProps } from "@components/Pages/SubsidyPage/SubsidyPage.types";
import type { IJSONTransformer } from "./IJSONTransformer";

export class SubsidyPageTransformer implements IJSONTransformer {
  public async Transform(cmsPageData: any): Promise<SubsidyPageProps> {
    const mainBody = cmsPageData.properties.mainBody;

    return {
      componentName: "SubsidyPage",
      pageName: cmsPageData.name,
      mainIntro: cmsPageData.properties.mainIntro || undefined,
      timeline: cmsPageData.properties.timeline || [],
      breadcrumb: cmsPageData.properties.breadcrumb || undefined,
      lastUpdatedDateText:
        cmsPageData.properties.lastUpdatedDateText || undefined,
      lastUpdatedDateString:
        cmsPageData.properties.lastUpdatedDateString || undefined,
      bottomContentArea: cmsPageData.properties.bottomContentArea || undefined,
      commonBottomArea: cmsPageData.properties.commonBottomArea || undefined,
      agency: cmsPageData.properties.agency || undefined,
      coordinator: cmsPageData.properties.coordinator || undefined,
      industryConnection:
        cmsPageData.properties.industryConnection || undefined,
      purposeConnection: cmsPageData.properties.purposeConnection || undefined,
      ...cmsPageData.properties,
      mainBody: mainBody ? { ...mainBody, addAnchors: true } : undefined,
    };
  }
}
