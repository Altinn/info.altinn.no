import type { IJSONTransformer } from "./IJSONTransformer";
import { fetchUmbracoAncestors, fetchUmbracoContent } from "../api/umbraco/client";
import { BlockTransformer } from "./BlockTransformer";
import { BreadcrumbsTransformer } from "./BreadcrumbsTransformer";
import { type Locale, t } from "@i18n/index";

function formatDate(dateStr?: string): string | undefined {
  if (!dateStr) return undefined;
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return undefined;

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}.${month}.${date.getFullYear()}`;
}

function normalizeRichTextHtml(html?: string): string {
  if (!html) {
    return "";
  }

  return html.replace(
    /((?:href|src)=["'])(\/dokumentmaler\/[^"']+)(["'])/gi,
    "$1/globalassets$2$3",
  );
}

function toRichTextArea(value: any) {
  if (!value?.items?.length) {
    return undefined;
  }

  return {
    items: value.items.map((item: any) => {
      const componentName = item.componentName ?? "RichText";
      if (componentName === "RichText") {
        return {
          ...item,
          componentName,
          html: normalizeRichTextHtml(item.html),
        };
      }
      return { ...item, componentName };
    }),
  };
}

async function hydrateContentAreaItems(items: any, locale: Locale) {
  if (!Array.isArray(items)) {
    return undefined;
  }

  const hydratedItems = await Promise.all(
    items.map(async (item: any) => {
      if (!item?.route?.path && !item?.id) {
        return item;
      }

      try {
        return await fetchUmbracoContent(item.id ?? item.route.path, locale);
      } catch {
        return item;
      }
    }),
  );

  return BlockTransformer.TransformBlocks(hydratedItems);
}

export class HeroArticlePageBaseTransformer implements IJSONTransformer {
  public async Transform(cmsPageData: any, globalData?: any): Promise<any> {
    const locale: Locale = globalData?.locale || "nb";
    const props = cmsPageData.properties ?? {};
    const ancestors = await fetchUmbracoAncestors(cmsPageData.id, locale);
    const breadcrumb = BreadcrumbsTransformer.Transform(ancestors, cmsPageData);
    const mainBody = toRichTextArea(props.mainBody);
    const bottomContentArea = props.bottomContentArea
      ? await hydrateContentAreaItems(props.bottomContentArea, locale)
      : undefined;
    const lastUpdatedDateString = formatDate(props.lastChanged ?? cmsPageData.updateDate);

    return {
      componentName: "HeroArticlePageBase",
      pageName: cmsPageData.name,
      articlePageHero: {},
      mainIntro: props.mainIntro,
      mainBody: mainBody ? { ...mainBody, addAnchors: true } : mainBody,
      breadcrumb,
      lastUpdatedDateText: lastUpdatedDateString ? t("common.lastUpdated", locale) : undefined,
      lastUpdatedDateString,
      bottomContentArea,
      isUserLoggedIn: false,
    };
  }
}
