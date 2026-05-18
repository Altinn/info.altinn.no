import type { IJSONTransformer } from "./IJSONTransformer";
import {
  fetchUmbracoAncestors,
  fetchUmbracoChildrenInEditorOrder,
} from "../api/umbraco/client";
import { BreadcrumbsTransformer } from "./BreadcrumbsTransformer";
import { hydrateContentAreaItems } from "./contentArea";
import { buildHelpSidebarViewModel } from "./helpSidebar";
import type { Locale } from "@i18n/index";

function mapChildPage(item: any) {
  const ct = item?.contentType;
  if (ct !== "helpQuestionPage" && ct !== "helpProcessArticlePage") {
    return null;
  }
  return {
    pageName: item?.name,
    pageType:
      ct === "helpQuestionPage" ? "HelpQuestionPage" : "HelpProcessArticlePage",
    url: item?.route?.path,
    body: item?.properties?.mainBody ?? undefined,
  };
}

export class HelpLandingPageTransformer implements IJSONTransformer {
  public async Transform(cmsPageData: any, globalData?: any): Promise<any> {
    const locale: Locale = globalData?.locale || "nb";
    const contentLocale: Locale = globalData?.contentLocale || locale;
    const props = cmsPageData?.properties ?? {};

    const [ancestors, children] = await Promise.all([
      fetchUmbracoAncestors(cmsPageData.id, contentLocale),
      fetchUmbracoChildrenInEditorOrder(cmsPageData.id, 100, contentLocale),
    ]);

    const breadcrumb = BreadcrumbsTransformer.Transform(ancestors, cmsPageData);

    const childPages = (children ?? [])
      .map(mapChildPage)
      .filter((p: any) => p !== null);

    const [bottomContentArea, pageSidebarViewModel] = await Promise.all([
      props.bottomContentArea
        ? hydrateContentAreaItems(props.bottomContentArea, contentLocale)
        : Promise.resolve(undefined),
      buildHelpSidebarViewModel(cmsPageData, ancestors, contentLocale),
    ]);

    return {
      componentName: "HelpLandingPage",
      pageName: cmsPageData?.name,
      mainIntro: props.mainIntro,
      questionHeading: props.questionHeading,
      topicName: props.topicName,
      childPages,
      bottomContentArea,
      breadcrumb,
      pageSidebarViewModel,
      isUserLoggedIn: false,
    };
  }
}
