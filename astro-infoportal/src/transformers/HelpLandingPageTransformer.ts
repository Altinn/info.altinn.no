import type { IJSONTransformer } from "./IJSONTransformer";

export class HelpLandingPageTransformer implements IJSONTransformer {
  public async Transform(cmsPageData: any): Promise<any> {
    return {
      componentName: "HelpLandingPage",
      pageName: cmsPageData.name,
      ...cmsPageData.properties,
      isUserLoggedIn: false,
    };
  }
}
