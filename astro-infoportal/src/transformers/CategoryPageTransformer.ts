import type { IJSONTransformer } from "./IJSONTransformer";

export class CategoryPageTransformer implements IJSONTransformer {
  public async Transform(cmsPageData: any): Promise<any> {
    return {
      componentName: "CategoryPage",
      pageName: cmsPageData.name,
      ...cmsPageData.properties,
      isUserLoggedIn: false,
    };
  }
}
