import { type Locale, t } from "@i18n/index";
import { fetchUmbracoAncestors } from "../api/umbraco/client";
import { BreadcrumbsTransformer } from "./BreadcrumbsTransformer";
import { BlockTransformer } from "./BlockTransformer";
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
    const ancestors = await fetchUmbracoAncestors(cmsPageData.route?.path ?? cmsPageData.id);
    const breadcrumb = BreadcrumbsTransformer.Transform(ancestors, cmsPageData);

    const lastUpdatedDateString = formatDate(cmsPageData?.updateDate ?? "");
    const lastUpdatedDateText = lastUpdatedDateString
      ? t("common.lastUpdated", locale)
      : undefined;

    const bottomContentArea = props.bottomContentArea
      ? BlockTransformer.TransformBlocks(props.bottomContentArea)
      : undefined;

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
      isUserLoggedIn: false,
    };
  }
}
