import type { IJSONTransformer } from "./IJSONTransformer";

export class AboutPageTransformer implements IJSONTransformer {
  public async Transform(cmsPageData: any): Promise<any> {
    return {
      componentName: "AboutPage",
      pageName: cmsPageData.name,
      ...cmsPageData.properties,
      isUserLoggedIn: false,
    };
  }
}
