export interface SearchResultResponse {
  items: SearchResultItem[];
  totalResultCount: number;
  totalPages: number;
  currentPageNumber: number;
  pageTypeFacets: FacetItem[];
  providerFacets: FacetItem[];
}

export interface SearchResultItem {
  type: string;
  title: string;
  ingress: string;
  url: string;
  contentGuid: string;
  score: number;
  hitId: string;
  trackId: string;
  isFallbackLanguage: boolean;
  parentContext: ParentContext | null;
}

export interface ParentContext {
  value: string;
}

export interface FacetItem {
  name: string;
  value: string;
  count: number;
}

export interface SearchSuggestionResponse {
  suggestions: SearchSuggestionItem[];
  totalHits: number;
}

export interface SearchSuggestionItem {
  title: string;
  url: string;
}

export interface ElasticsearchConfig {
  url: string;
  indexPrefix: string;
  apiKey?: string;
}
