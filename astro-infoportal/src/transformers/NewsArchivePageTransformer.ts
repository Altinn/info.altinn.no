import type { IJSONTransformer } from "./IJSONTransformer";
import { fetchUmbracoAncestors, fetchUmbracoChildren } from "../api/umbraco/client";
import { BreadcrumbsTransformer } from "./BreadcrumbsTransformer";
import { sortNewsByEffectiveDateDesc } from "./newsSort";
import { type Locale, t } from "@i18n/index";

const PAGE_SIZE = 5;

function isNewsArticle(item: any) {
  return item?.contentType === "newsArticlePage";
}

function parsePageNumber(rawValue?: string) {
  const parsed = Number.parseInt(rawValue ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export class NewsArchivePageTransformer implements IJSONTransformer {
  public async Transform(cmsPageData: any, globalData?: any): Promise<any> {
    const locale: Locale = globalData?.locale || "nb";
    const contentLocale: Locale = globalData?.contentLocale || locale;
    const allChildren = await fetchUmbracoChildren(
      cmsPageData.route.path,
      500,
      contentLocale,
      "updateDate:desc",
    );
    const newsChildren = sortNewsByEffectiveDateDesc(
      allChildren.filter(isNewsArticle),
    );

    const requestedPageNumber = parsePageNumber(globalData?.query?.pagenumber);
    const totalPages = Math.max(1, Math.ceil(newsChildren.length / PAGE_SIZE));
    const currentPageNumber = Math.min(requestedPageNumber, totalPages);
    const startIndex = (currentPageNumber - 1) * PAGE_SIZE;
    const paginatedArticles = newsChildren.slice(startIndex, startIndex + PAGE_SIZE);

    const ancestors = await fetchUmbracoAncestors(cmsPageData.id, contentLocale);
    const breadcrumb = BreadcrumbsTransformer.Transform(ancestors, cmsPageData);

    const newsArticles = paginatedArticles.map((child: any) => {
        return {
            pageName: child.name,
            mainIntro: child.properties.mainIntro,
            url: child.route.path,
            lastChanged: null,
            componentName: "NewsArticleItem"
        };
      });

    return {
      componentName: "NewsArchivePage",
      pageName: cmsPageData.name,
      newsArticles: newsArticles,
      totalPages,
      currentPageNumber,
      lastPageText: t("search.previous", locale),
      nextPageText: t("search.next", locale),
      breadcrumb: breadcrumb
    };
  }
}
