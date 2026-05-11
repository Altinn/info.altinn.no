import type { IJSONTransformer } from "./IJSONTransformer";
import { fetchUmbracoAncestors } from "../api/umbraco/client";
import { BreadcrumbsTransformer } from "./BreadcrumbsTransformer";

export class HelpSearchPageTransformer implements IJSONTransformer {
  public async Transform(cmsPageData: any, globalData?: any): Promise<any> {
    const ancestors = await fetchUmbracoAncestors(cmsPageData.route?.path ?? cmsPageData.id);
    const breadcrumb = BreadcrumbsTransformer.Transform(ancestors, cmsPageData);

    return {
      componentName: "HelpSearchPage",
      pageName: cmsPageData?.name,
      ...cmsPageData?.properties,
      helpSearchPageUrl: cmsPageData?.route?.path,
      searchPageUrl: globalData?.headerViewModel?.searchPageUrl,
      breadcrumb,
      isUserLoggedIn: false,
    };
  }
}
