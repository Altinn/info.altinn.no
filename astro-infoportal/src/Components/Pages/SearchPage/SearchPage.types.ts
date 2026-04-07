export interface SearchPageProps {
  componentName?: string;
  currentLanguage?: string;
  currentQuery?: string;
  currentContext?: string;
  pageTypeFacets?: any[];
  providerFacets?: any[];
  searchResultViewModel?: any;
  suggestionTerm?: string;
  suggestionTermText?: string;
  categoriesText?: string;
  providersText?: string;
  noResultsText?: string;
  errorText?: string;
  lastPageText?: string;
  nextPageText?: string;
  loadingText?: string;
  providerFilterText?: string;
  searchPlaceholder?: string;
  searchAriaLabel?: string;
}
