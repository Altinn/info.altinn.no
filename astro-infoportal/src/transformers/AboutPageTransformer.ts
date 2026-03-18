import type { IJSONTransformer } from "./IJSONTransformer";

export class AboutPageTransformer implements IJSONTransformer {
  public Transform(cmsPageData: any): any {
    return {
      componentName: "AboutPage",
      pageName: cmsPageData.name,
      ...cmsPageData.properties,
      isUserLoggedIn: false,
    };
  }
}
