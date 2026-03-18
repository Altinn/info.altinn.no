import type { IJSONTransformer } from "./IJSONTransformer";

export class Error404PageTransformer implements IJSONTransformer {
  public Transform(cmsPageData: any): any {
    return {
      componentName: "Error404Page",
      pageName: cmsPageData.name,
      ...cmsPageData.properties,
      isUserLoggedIn: false,
    };
  }
}
