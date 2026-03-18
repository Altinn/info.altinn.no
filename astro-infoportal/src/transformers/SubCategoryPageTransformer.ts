import type { IJSONTransformer } from "./IJSONTransformer";
import type { SubCategoryPageViewModel } from "../Models/Generated/SubCategoryPageViewModel";

export class SubCategoryPageTransformer implements IJSONTransformer {
  public async Transform(cmsPageData: any): Promise<SubCategoryPageViewModel> {
    return {
      componentName: "SubCategoryPage",
      pageName: cmsPageData.name,
      description: cmsPageData.properties.description || undefined,
      timelineHeading: cmsPageData.properties.timelineHeading || undefined,
      timeline: cmsPageData.properties.timeline || [],
      schemas: cmsPageData.properties.schemas || [],
      breadcrumb: cmsPageData.properties.breadcrumb || undefined,
      boxBlocks: cmsPageData.properties.boxBlocks || undefined,
      accordions: cmsPageData.properties.accordions || undefined,
      promoArea: cmsPageData.properties.promoArea || undefined,
      ...cmsPageData.properties,
    } as SubCategoryPageViewModel;
  }
}
