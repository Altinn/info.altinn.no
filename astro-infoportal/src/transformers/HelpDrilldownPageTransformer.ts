import type { IJSONTransformer } from "./IJSONTransformer";

export class HelpDrilldownPageTransformer implements IJSONTransformer {
  public Transform(cmsPageData: any): any {
    return {
      componentName: "HelpDrilldownPage",
      pageName: cmsPageData.name,
      ...cmsPageData.properties,
      isUserLoggedIn: false,
    };
  }
}
