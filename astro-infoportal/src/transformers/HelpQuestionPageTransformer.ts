import type { IJSONTransformer } from "./IJSONTransformer";
import { fetchUmbracoAncestors } from "../api/umbraco/client";
import { BreadcrumbsTransformer } from "./BreadcrumbsTransformer";

export class HelpQuestionPageTransformer implements IJSONTransformer {
  public async Transform(cmsPageData: any): Promise<any> {
    const ancestors = await fetchUmbracoAncestors(cmsPageData.route?.path ?? cmsPageData.id);
    const breadcrumb = BreadcrumbsTransformer.Transform(ancestors, cmsPageData);

    return {
      componentName: "HelpQuestionPage",
      pageName: cmsPageData?.name,
      ...cmsPageData?.properties,
      breadcrumb,
      isUserLoggedIn: false,
    };
  }
}
