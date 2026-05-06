import type { SubsidyPageProps } from "@components/Pages/SubsidyPage/SubsidyPage.types";
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

export class SubsidyPageTransformer implements IJSONTransformer {
  public async Transform(
    cmsPageData: any,
    globalData?: any,
  ): Promise<SubsidyPageProps> {
    const props = cmsPageData.properties ?? {};
    const locale: Locale = globalData?.locale ?? "nb";

    const ancestors = await fetchUmbracoAncestors(cmsPageData.route.path);
    const breadcrumb = BreadcrumbsTransformer.Transform(ancestors, cmsPageData);

    const mainBody = props.mainBody;
    const lastUpdatedDateString = formatDate(cmsPageData.updateDate ?? "");
    const lastUpdatedDateText = lastUpdatedDateString
      ? t("common.lastUpdated", locale)
      : undefined;

    return {
      componentName: "SubsidyPage",
      pageName: cmsPageData.name,
      mainIntro: props.mainIntro || undefined,
      mainBody: mainBody ? { ...mainBody, addAnchors: true } : undefined,
      timeline: props.timeline || [],
      breadcrumb,
      lastUpdatedDateText,
      lastUpdatedDateString: lastUpdatedDateString || undefined,
      bottomContentArea: props.bottomContentArea || undefined,
    };
  }
}
