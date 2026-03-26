import type { IJSONTransformer } from "./IJSONTransformer";

export class HelpDrilldownPageTransformer implements IJSONTransformer {
  public async Transform(cmsPageData: any): Promise<any> {
    return {
      componentName: "HelpDrilldownPage",
      pageName: cmsPageData.name,
      ...cmsPageData.properties,
      isUserLoggedIn: false,
    };
  }
}
