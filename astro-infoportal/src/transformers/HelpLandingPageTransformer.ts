import type { IJSONTransformer } from "./IJSONTransformer";

export class HelpLandingPageTransformer implements IJSONTransformer {
  public Transform(cmsPageData: any): any {
    return {
      componentName: "HelpLandingPage",
      pageName: cmsPageData.name,
      ...cmsPageData.properties,
      isUserLoggedIn: false,
    };
  }
}
