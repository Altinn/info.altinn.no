import { type Locale, t } from "@i18n/index";
import { fetchUmbracoAncestors } from "../api/umbraco/client";
import { BreadcrumbsTransformer } from "./BreadcrumbsTransformer";
import { hydrateContentAreaItems } from "./contentArea";
import { buildHelpSidebarViewModel } from "./helpSidebar";
import type { IJSONTransformer } from "./IJSONTransformer";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}.${month}.${d.getFullYear()}`;
}

export class HelpProcessArticlePageTransformer implements IJSONTransformer {
  public async Transform(cmsPageData: any, globalData?: any): Promise<any> {
    const props = cmsPageData?.properties ?? {};
    const locale: Locale = globalData?.locale ?? "nb";
    const contentLocale: Locale = globalData?.contentLocale ?? locale;
    const ancestors = await fetchUmbracoAncestors(cmsPageData.id, contentLocale);
    const breadcrumb = BreadcrumbsTransformer.Transform(ancestors, cmsPageData);

    const lastUpdatedDateString = formatDate(
      props.lastChanged ?? cmsPageData?.updateDate ?? "",
    );
    const lastUpdatedDateText = lastUpdatedDateString
      ? t("common.lastUpdated", locale)
      : undefined;

    const [bottomContentArea, pageSidebarViewModel] = await Promise.all([
      props.bottomContentArea
        ? hydrateContentAreaItems(props.bottomContentArea, contentLocale)
        : Promise.resolve(undefined),
      buildHelpSidebarViewModel(cmsPageData, ancestors, contentLocale),
    ]);

    return {
      componentName: "HelpProcessArticlePage",
      pageName: cmsPageData?.name,
      mainIntro: props.mainIntro,
      mainBody: props.mainBody,
      timeline: props.timeline ?? [],
      bottomContentArea,
      linkToPortalProcess: props.linkToPortalProcess,
      lastUpdatedDateString: lastUpdatedDateString || undefined,
      lastUpdatedDateText,
      breadcrumb,
      pageSidebarViewModel,
      isUserLoggedIn: false,
    };
  }
}
