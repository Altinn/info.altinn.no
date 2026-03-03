/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

import { IReactProps } from "./IReactProps";
import { IReactComponentProps } from "./IReactComponentProps";
import { BaseReactComponentProps } from "./BaseReactComponentProps";
import { BreadcrumbViewModel } from "./BreadcrumbViewModel";
import { FacetViewModel } from "./FacetViewModel";
import { SearchResultViewModel } from "./SearchResultViewModel";

export interface SearchPageViewModel extends IReactProps, IReactComponentProps, BaseReactComponentProps {
  breadcrumb: BreadcrumbViewModel;
  currentLanguage?: string;
  currentQuery?: string;
  currentContext?: string;
  pageTypeFacets: FacetViewModel[];
  providerFacets: FacetViewModel[];
  suggestionTermText?: string;
  suggestionTerm?: string;
  isUserLoggedIn: boolean;
  searchSummaryText?: string;
  searchSummaryAIWarningText?: string;
  searchSummaryNoResultText?: string;
  searchResultViewModel?: SearchResultViewModel;
  categoriesText?: string;
  providersText?: string;
  errorText?: string;
  noResultsText?: string;
  lastPageText?: string;
  nextPageText?: string;
  loadingText?: string;
  providerFilterText?: string;
  searchPlaceholder?: string;
  searchAriaLabel?: string;
}
