export interface SearchSuggestion {
  title: string;
  url: string;
}

export interface SearchSuggestionCollection {
  suggestions: SearchSuggestion[];
  totalHits: number;
}