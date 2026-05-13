import type { IJSONTransformer } from "./IJSONTransformer";
import {
  fetchUmbracoAncestors,
  fetchUmbracoContent,
} from "../api/umbraco/client";
import { BreadcrumbsTransformer } from "./BreadcrumbsTransformer";
import { elasticsearchConfig } from "../api/elasticsearch/client";
import { searchPages } from "../Services/Elasticsearch";
import { SearchContext } from "../Constants/searchContext";
import type { SearchResultItem } from "../Services/Elasticsearch/types";
import { type Locale, t } from "@i18n/index";

const MAX_QUERY_LENGTH = 200;
const PAGE_SIZE = 10;

function pageTypeFromContentType(contentType: string): string | undefined {
  if (contentType === "helpQuestionPage") return "HelpQuestionPage";
  if (contentType === "helpProcessArticlePage") return "HelpProcessArticlePage";
  return undefined;
}

async function mapResult(hit: SearchResultItem, locale: Locale) {
  // Hits carry only the indexed text; fetch the full Umbraco content to get
  // the structured mainBody (RichTextArea shape) for inline expansion.
  let body: unknown;
  try {
    const full = await fetchUmbracoContent(hit.url, locale);
    body = full?.properties?.mainBody ?? undefined;
  } catch {
    body = undefined;
  }
  return {
    pageName: hit.title,
    pageType: pageTypeFromContentType(hit.type),
    url: hit.url,
    body,
  };
}

export class HelpSearchPageTransformer implements IJSONTransformer {
  public async Transform(cmsPageData: any, globalData?: any): Promise<any> {
    const locale: Locale = globalData?.locale ?? "nb";
    const ancestors = await fetchUmbracoAncestors(cmsPageData.id, locale);
    const breadcrumb = BreadcrumbsTransformer.Transform(ancestors, cmsPageData);

    const query = String(globalData?.query?.q ?? "")
      .trim()
      .slice(0, MAX_QUERY_LENGTH);

    let totalHits = 0;
    let results: any[] = [];

    if (query) {
      const response = await searchPages(
        elasticsearchConfig,
        query,
        locale,
        1,
        PAGE_SIZE,
        SearchContext.Help,
      );
      totalHits = response.totalResultCount;
      results = await Promise.all(response.items.map((hit) => mapResult(hit, locale)));
    }

    return {
      componentName: "HelpSearchPage",
      pageName: cmsPageData?.name,
      query,
      totalHits,
      results,
      searchHitsText: t("search.hits", locale),
      searchForText: t("search.for", locale),
      advertisementIntroText: t("search.advertisements.helpSection.intro", locale),
      clickHereText: t("common.clickHere", locale),
      toSearchForText: t("search.advertisements.toSearchFor", locale),
      inText: t("common.in", locale),
      otherContentText: t("search.advertisements.helpSection.otherContent", locale),
      searchPageUrl: globalData?.headerViewModel?.searchPageUrl,
      helpSearchPageUrl: cmsPageData?.route?.path,
      searchPlaceholder: t("header.searchPlaceholder", locale),
      breadcrumb,
      isUserLoggedIn: false,
    };
  }
}
