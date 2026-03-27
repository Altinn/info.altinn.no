import type { IJSONTransformer } from "../IJSONTransformer";
import { fetchUmbracoAncestors } from "../../../api/umbraco/client";
import { BreadcrumbsTransformer } from "../../BreadcrumbsTransformer";
import type { SearchPageViewModel } from "../../../Models/Generated/SearchPageViewModel";

export class SearchPageTransformer implements IJSONTransformer {
  public async Transform(cmsPageData: any): Promise<SearchPageViewModel> {
    /* C# logic (TS-ish++):
    const httpcontext: httpContextAccessor.HttpContext;
                const searchqueryText: httpContext?.Request.Query[QueryParamSearch].ToString();
                /*const searchpageNumber: httpContext?.Request.Query[QueryParamPageNumber].ToString();* /
                const searchcontext: httpContext?.Request.Query[QueryParamContext].ToString();
                const providers: httpContext?.Request.Query[QueryParamProviders];
    
                //const currentpageNumber: int.TryParse(searchPageNumber, out const p) && p > 0
                //? p : (Skip / Take) + 1;
    
                const currentpageNumber: 1;
    
                const culture: CultureInfo.CurrentCulture.NormalizeCulture();
    
                // If no search term provided, return an empty model to avoid unnecessary processing
                if (string.IsNullOrWhiteSpace(searchQueryText))
                {
                    return {
                        breadcrumb: breadcrumbViewModelBuilder.Build({ currentPage: currentPage }),
                        currentLanguage: culture.TwoLetterISOLanguageName,
                        currentQuery: "",
                        currentContext: "",
                        pageTypeFacets: [],
                        providerFacets: [],
                        suggestionTerm: null,
                        isUserLoggedIn: httpContext?.Request.IsUserLoggedIn() ?? false,
                        searchSummaryText: currentPage.SearchSummaryText,
                        searchSummaryAIWarningText: currentPage.SearchSummaryAIWarningText,
                        searchSummaryNoResultText: currentPage.SearchSummaryNoResultText,
                        searchResultViewModel: null,
                        categoriesText: localizationService.GetStringByCulture("/search/categories", culture),
                        providersText: localizationService.GetStringByCulture("/search/providers", culture),
                        errorText: localizationService.GetStringByCulture("/search/error", culture),
                        noResultsText: localizationService.GetStringByCulture("/quickhelp/searchhitsprefix", culture),
                        lastPageText: localizationService.GetStringByCulture("/search/lastpage", culture),
                        nextPageText: localizationService.GetStringByCulture("/search/nextpage", culture),
                        loadingText: localizationService.GetStringByCulture("/common/loading", culture),
                        providerFilterText: localizationService.GetStringByCulture("/schema/agency", culture).ToLower(),
                        searchPlaceholder: localizationService.GetStringByCulture("/search/searchaftercontent", culture),
                        searchAriaLabel: localizationService.GetStringByCulture("/search/searcharialabel", culture)
                    };
                }
                const searchcontextParsed: SearchContextHelper.ParseContext(searchContext);
                const searchquery: {
                    term: searchQueryText,
                    searchPageStopWords: currentPage.StopWords,
                    searchPageSynonymStopWords: currentPage.SynonymStopWords,
                    searchPageUseDecompounding: currentPage.UseDecompounding,
                    selectedContext: searchContextParsed,
                    showScore: currentPage.ShowScore,
                    withFacets: true,
                    enableSpellcheck: true,
                    spellcheckHitsCutoff: 3,
                    searchSortOrder: SearchSortOrder.None, // by relevance
                    pageTypesToExclude: GetExcludedContentIds(),
                    languageBranch: culture.Name
                };
                const searchresult: searchService.PageSearch(searchQuery, currentPageNumber, Take, culture, true)
                    .GetAwaiter()
                    .GetResult();
    
                const searchresultItems: searchResult.Items? ?? [];
                const searchresultViewModelList: searchResultMapper.MapSearchResults(searchResultItems, culture);
    
    
                const breadcrumb: breadcrumbViewModelBuilder.Build({ currentPage: currentPage });
    
                const searchpageViewModel: {
                    breadcrumb: breadcrumb,
                    currentLanguage: culture.Name,
                    currentQuery: searchQueryText,
                    currentContext: searchContextParsed.ToString(),
                    pageTypeFacets: CreatePageTypeFacetList(searchResult.DocumentTypeFacet, culture),
                    providerFacets: searchResult.ProviderFacet?.map(x: > { name: x.Name, value: x.Name, count: x.Count }),
                    suggestionTermText: localizationService.GetStringByCulture("/search/suggestiontext", culture),
                    suggestionTerm: searchResult.SuggestionTerm,
                    searchSummaryAIWarningText: currentPage.SearchSummaryAIWarningText,
                    searchSummaryText: currentPage.SearchSummaryText,
                    searchSummaryNoResultText: currentPage.SearchSummaryNoResultText,
                    isUserLoggedIn: false,
                    searchResultViewModel: {
                        totalResultCount: searchResult.TotalMatching,
                        items: searchResultViewModelList,
                        totalPages: (int)Math.Ceiling((double)searchResult.TotalMatching / Take),
                        currentPageNumber: currentPageNumber
                    },
                    categoriesText: localizationService.GetStringByCulture("/search/categories", culture),
                    providersText: localizationService.GetStringByCulture("/search/providers", culture),
                    errorText: localizationService.GetStringByCulture("/search/error", culture),
                    noResultsText: localizationService.GetStringByCulture("/quickhelp/searchhitsprefix", culture),
                    lastPageText: localizationService.GetStringByCulture("/search/lastpage", culture),
                    nextPageText: localizationService.GetStringByCulture("/search/nextpage", culture),
                    loadingText: localizationService.GetStringByCulture("/common/loading", culture),
                    providerFilterText: localizationService.GetStringByCulture("/schema/agency", culture).ToLower(),
                    searchPlaceholder: localizationService.GetStringByCulture("/search/search", culture),
                    searchAriaLabel: localizationService.GetStringByCulture("/search/searcharialabel", culture)
                };
    
                return searchPageViewModel
    */
        const ancestors = await fetchUmbracoAncestors(cmsPageData.id);
    const breadcrumb = BreadcrumbsTransformer.Transform(ancestors, cmsPageData);
    return {
      componentName: "SearchPage",
      breadcrumb: breadcrumb,
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
    } as SearchPageViewModel;
  }
}













