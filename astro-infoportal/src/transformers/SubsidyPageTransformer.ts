import type { IJSONTransformer } from "./IJSONTransformer";
import type { SubsidyPageViewModel } from "../Models/Generated/SubsidyPageViewModel";

export class SubsidyPageTransformer implements IJSONTransformer {
  public async Transform(cmsPageData: any): Promise<SubsidyPageViewModel> {
    return {
      componentName: "SubsidyPage",
      pageName: cmsPageData.name,
      mainIntro: cmsPageData.properties.mainIntro || undefined,
      mainBody: cmsPageData.properties.mainBody || undefined,
      timeline: cmsPageData.properties.timeline || [],
      breadcrumb: cmsPageData.properties.breadcrumb || undefined,
      lastUpdatedDateText: cmsPageData.properties.lastUpdatedDateText || undefined,
      lastUpdatedDateString: cmsPageData.properties.lastUpdatedDateString || undefined,
      bottomContentArea: cmsPageData.properties.bottomContentArea || undefined,
      commonBottomArea: cmsPageData.properties.commonBottomArea || undefined,
      agency: cmsPageData.properties.agency || undefined,
      coordinator: cmsPageData.properties.coordinator || undefined,
      industryConnection: cmsPageData.properties.industryConnection || undefined,
      purposeConnection: cmsPageData.properties.purposeConnection || undefined,
      ...cmsPageData.properties,
    } as SubsidyPageViewModel;
  }
}
