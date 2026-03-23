import type { IJSONTransformer } from "./IJSONTransformer";

export class HeroArticlePageBaseTransformer implements IJSONTransformer {
  public async Transform(cmsPageData: any): Promise<any> {
    return {
      componentName: "HeroArticlePageBase",
      pageName: cmsPageData.name,
      articlePageHero: {},
      mainIntro: cmsPageData.properties.mainIntro,
      mainBody: cmsPageData.properties.mainBody,
      isUserLoggedIn: false,
    };
  }
}
