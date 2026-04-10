import type { IJSONTransformer } from "./IJSONTransformer";
import { fetchUmbracoAncestors } from "../api/umbraco/client";
import { BreadcrumbsTransformer } from "./BreadcrumbsTransformer";

export class HeroArticlePageBaseTransformer implements IJSONTransformer {
  public async Transform(cmsPageData: any): Promise<any> {
    const ancestors = await fetchUmbracoAncestors(cmsPageData.route.path);    
    const breadcrumb = BreadcrumbsTransformer.Transform(ancestors, cmsPageData);  

    return {
      componentName: "HeroArticlePageBase",
      pageName: cmsPageData.name,
      articlePageHero: {},
      mainIntro: cmsPageData.properties.mainIntro,
      mainBody: cmsPageData.properties.mainBody,
      breadcrumb: breadcrumb,
      isUserLoggedIn: false,
    };
  }
}
