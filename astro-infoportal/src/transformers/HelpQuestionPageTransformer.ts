import type { IJSONTransformer } from "./IJSONTransformer";
import { fetchUmbracoAncestors } from "../api/umbraco/client";
import { BreadcrumbsTransformer } from "./BreadcrumbsTransformer";
import { buildHelpSidebarViewModel } from "./helpSidebar";
import type { Locale } from "@i18n/index";

export class HelpQuestionPageTransformer implements IJSONTransformer {
  public async Transform(cmsPageData: any, globalData?: any): Promise<any> {
    const locale: Locale = globalData?.locale ?? "nb";
    const ancestors = await fetchUmbracoAncestors(cmsPageData.id, locale);
    const breadcrumb = BreadcrumbsTransformer.Transform(ancestors, cmsPageData);
    const pageSidebarViewModel = await buildHelpSidebarViewModel(
      cmsPageData,
      ancestors,
      locale,
    );

    return {
      componentName: "HelpQuestionPage",
      pageName: cmsPageData?.name,
      ...cmsPageData?.properties,
      breadcrumb,
      pageSidebarViewModel,
      isUserLoggedIn: false,
    };
  }
}
