import type { IJSONTransformer } from "./IJSONTransformer";
import type { SearchPageProps } from "@components/Pages/SearchPage/SearchPage.types";

export class SearchPageTransformer implements IJSONTransformer {
  public async Transform(cmsPageData: any): Promise<SearchPageProps> {
    return {
      componentName: "SearchPage",
      breadcrumb: cmsPageData.properties.breadcrumb || undefined,
      currentLanguage: cmsPageData.properties.currentLanguage || undefined,
      currentQuery: cmsPageData.properties.currentQuery || undefined,
      currentContext: cmsPageData.properties.currentContext || undefined,
      pageTypeFacets: cmsPageData.properties.pageTypeFacets || [],
      providerFacets: cmsPageData.properties.providerFacets || [],
      suggestionTermText: cmsPageData.properties.suggestionTermText || undefined,
      suggestionTerm: cmsPageData.properties.suggestionTerm || undefined,
      isUserLoggedIn: cmsPageData.properties.isUserLoggedIn || false,
      searchSummaryText: cmsPageData.properties.searchSummaryText || undefined,
      searchSummaryAIWarningText: cmsPageData.properties.searchSummaryAIWarningText || undefined,
      searchSummaryNoResultText: cmsPageData.properties.searchSummaryNoResultText || undefined,
      searchResultViewModel: cmsPageData.properties.searchResultViewModel || undefined,
      categoriesText: cmsPageData.properties.categoriesText || undefined,
      providersText: cmsPageData.properties.providersText || undefined,
      errorText: cmsPageData.properties.errorText || undefined,
      noResultsText: cmsPageData.properties.noResultsText || undefined,
      ...cmsPageData.properties,
    };
  }
}
