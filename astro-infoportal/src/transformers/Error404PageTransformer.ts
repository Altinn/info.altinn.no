import type { IJSONTransformer } from "./IJSONTransformer";

export class Error404PageTransformer implements IJSONTransformer {
  public async Transform(cmsPageData: any): Promise<any> {
    return {
      componentName: "Error404Page",
      pageName: cmsPageData.name,
      ...cmsPageData.properties,
      isUserLoggedIn: false,
    };
  }
}
