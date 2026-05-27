import type { IJSONTransformer } from "./IJSONTransformer";
import {
  fetchUmbracoAncestors,
  fetchUmbracoChildrenInEditorOrder,
  fetchUmbracoContentWithLocaleFallback,
} from "../api/umbraco/client";
import { BreadcrumbsTransformer } from "./BreadcrumbsTransformer";
import { hydrateContentAreaItems } from "./contentArea";
import { buildHelpSidebarViewModel } from "./helpSidebar";
import type { Locale } from "@i18n/index";

async function getChildPages(children: any, contentLocale: Locale) {
    const childPages = [];
    for (const child of children) {
        childPages.push(await getChildPage(child, contentLocale));
    }
    return childPages;
}

async function getChildPage(child: any, contentLocale: Locale) {
    const ct = child?.contentType;
    if (ct !== "helpQuestionPage" && ct !== "helpProcessArticlePage" && ct !== "placeholder") {
      return null;
    }

    // Should body be fetched from other page? (Replacing shortcut feature in old CMS)
    const cp = child?.properties.contentPage;
    const body = (cp && cp.length > 0) ? 
        await fetchBodyFromOtherPage(cp[0].id, contentLocale) : child?.properties?.mainBody;

    return {
      pageName: child?.name,
      pageType: ct === "helpQuestionPage" ? "HelpQuestionPage" : "HelpProcessArticlePage",
      url: child?.route?.path,
      body,
    };
}

async function fetchBodyFromOtherPage(pageId: string, contentLocale: Locale) {
    const contentFromOtherPage = await fetchUmbracoContentWithLocaleFallback(pageId, contentLocale);
    return contentFromOtherPage?.properties?.mainBody;
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

    const childPages = await getChildPages(children, contentLocale);

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
