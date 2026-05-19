import type { IJSONTransformer } from "./IJSONTransformer";
import {
  fetchUmbracoAncestors,
  fetchUmbracoChildrenInEditorOrder,
} from "../api/umbraco/client";
import { BreadcrumbsTransformer } from "./BreadcrumbsTransformer";
import { hydrateContentAreaItems } from "./contentArea";
import { buildHelpSidebarViewModel } from "./helpSidebar";
import type { Locale } from "@i18n/index";

function mapLandingPage(item: any) {
  return {
    pageName: item?.name,
    mainIntro: item?.properties?.mainIntro ?? undefined,
    url: item?.route?.path,
  };
}

export class HelpDrilldownPageTransformer implements IJSONTransformer {
  public async Transform(cmsPageData: any, globalData?: any): Promise<any> {
    const locale: Locale = globalData?.locale || "nb";
    const contentLocale: Locale = globalData?.contentLocale || locale;
    const props = cmsPageData?.properties ?? {};

    const [ancestors, children] = await Promise.all([
      fetchUmbracoAncestors(cmsPageData.id, contentLocale),
      fetchUmbracoChildrenInEditorOrder(cmsPageData.id, 100, contentLocale),
    ]);

    const breadcrumb = BreadcrumbsTransformer.Transform(ancestors, cmsPageData);

    const landingPages = (children ?? [])
      .filter((c: any) => c?.contentType === "helpLandingPage")
      .map(mapLandingPage);

    const [bottomContentArea, pageSidebarViewModel] = await Promise.all([
      props.bottomContentArea
        ? hydrateContentAreaItems(props.bottomContentArea, contentLocale)
        : Promise.resolve(undefined),
      buildHelpSidebarViewModel(cmsPageData, ancestors, contentLocale),
    ]);

    return {
      componentName: "HelpDrilldownPage",
      pageName: cmsPageData?.name,
      triggerWords: props.triggerWords,
      akselIcon: props.akselIcon,
      altImage: props.altImage,
      landingPages,
      bottomContentArea,
      breadcrumb,
      pageSidebarViewModel,
      isUserLoggedIn: false,
    };
  }
}
