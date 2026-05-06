import { type Locale, t } from "@i18n/index";
import { fetchUmbracoAncestors } from "../api/umbraco/client";
import { BreadcrumbsTransformer } from "./BreadcrumbsTransformer";
import type { IJSONTransformer } from "./IJSONTransformer";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}.${month}.${d.getFullYear()}`;
}

export class HeroArticlePageBaseTransformer implements IJSONTransformer {
  public async Transform(cmsPageData: any, globalData?: any): Promise<any> {
    const ancestors = await fetchUmbracoAncestors(cmsPageData.route.path);
    const breadcrumb = BreadcrumbsTransformer.Transform(ancestors, cmsPageData);

    const mainBody = cmsPageData.properties.mainBody;
    const locale: Locale = globalData?.locale ?? "nb";
    const lastUpdatedDateString = formatDate(cmsPageData.updateDate ?? "");
    const lastUpdatedDateText = lastUpdatedDateString
      ? t("common.lastUpdated", locale)
      : undefined;

    return {
      componentName: "HeroArticlePageBase",
      pageName: cmsPageData.name,
      articlePageHero: {},
      mainIntro: cmsPageData.properties.mainIntro,
      mainBody: mainBody ? { ...mainBody, addAnchors: true } : mainBody,
      breadcrumb: breadcrumb,
      timeline: cmsPageData.properties.timeline ?? [],
      bottomContentArea: cmsPageData.properties.bottomContentArea ?? undefined,
      lastUpdatedDateText,
      lastUpdatedDateString: lastUpdatedDateString || undefined,
      isUserLoggedIn: false,
    };
  }
}
