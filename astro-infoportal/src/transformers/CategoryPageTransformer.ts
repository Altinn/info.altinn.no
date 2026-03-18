import type { IJSONTransformer } from "./IJSONTransformer";

export class CategoryPageTransformer implements IJSONTransformer {
  public Transform(cmsPageData: any): any {
    return {
      componentName: "CategoryPage",
      pageName: cmsPageData.name,
      ...cmsPageData.properties,
      isUserLoggedIn: false,
    };
  }
}
