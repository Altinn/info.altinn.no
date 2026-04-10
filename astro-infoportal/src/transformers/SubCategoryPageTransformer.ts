import type { IJSONTransformer } from "./IJSONTransformer";
import type { SubCategoryPageProps } from "@components/Pages/SubCategoryPage/SubCategoryPage.types";

export class SubCategoryPageTransformer implements IJSONTransformer {
  public async Transform(cmsPageData: any): Promise<SubCategoryPageProps> {
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
    };
  }
}
