import { fetchUmbracoAncestors } from "../api/umbraco/client";
import { BreadcrumbsTransformer } from "./BreadcrumbsTransformer";
import type { IJSONTransformer } from "./IJSONTransformer";

export class HeroArticlePageBaseTransformer implements IJSONTransformer {
  public async Transform(cmsPageData: any): Promise<any> {
    const ancestors = await fetchUmbracoAncestors(cmsPageData.route.path);
    const breadcrumb = BreadcrumbsTransformer.Transform(ancestors, cmsPageData);

    const mainBody = cmsPageData.properties.mainBody;

    return {
      componentName: "HeroArticlePageBase",
      pageName: cmsPageData.name,
      articlePageHero: {},
      mainIntro: cmsPageData.properties.mainIntro,
      mainBody: mainBody ? { ...mainBody, addAnchors: true } : mainBody,
      breadcrumb: breadcrumb,
      isUserLoggedIn: false,
    };
  }
}
