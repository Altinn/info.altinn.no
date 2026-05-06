import {
  getContentTypesForContext,
  getContextForContentType,
  groupByContext,
} from "./SearchContextMapping";
import type {
  ElasticsearchConfig,
  FacetItem,
  SearchResultItem,
  SearchResultResponse,
  SearchSuggestionItem,
  SearchSuggestionResponse,
} from "./types";

// bestBetTriggers carries editorial trigger phrases (dialect, deprecated terms,
// synonyms) that may not appear in the page itself. High boost so pages with
// matching triggers rank above fuzzy hits. See umbraco-infoportal/Search/BestBets/.
const SEARCH_FIELDS = ["title^3", "ingress^2", "body", "bestBetTriggers^5"];
const DEFAULT_PAGE_SIZE = 10;

function getIndexName(config: ElasticsearchConfig, culture: string): string {
  return `${config.indexPrefix}-${culture.toLowerCase()}`;
}

function buildHeaders(config: ElasticsearchConfig): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (config.apiKey) {
    headers["Authorization"] = `ApiKey ${config.apiKey}`;
  }
  return headers;
}

function stripEmTags(text: string): string {
  return text.replace(/<em>/g, "").replace(/<\/em>/g, "");
}

function buildSearchBody(
  query: string,
  from: number,
  size: number,
  context: string | null | undefined,
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    from,
    size,
    query: {
      multi_match: {
        query,
        fields: SEARCH_FIELDS,
        type: "best_fields",
        // AND operator — matches legacy Optimizely Find behavior
        // (FindExtensions.cs called .WithAndAsDefaultOperator()). With OR (the
        // ES default), a query like "råne stasjon" would match any doc with
        // either "råne" OR "stasjon", letting loan pages that mention e.g.
        // "tankstasjon" or "togstasjon" surface incorrectly.
        operator: "and",
        // No fuzziness — also matches legacy. Fuzziness "AUTO" let the r→l
        // substitution match "råne" against "låne" → stems to "lån" → matched
        // pages like "Boliglån..." via the indexed "lån" token. Re-enable only
        // with care (e.g. "AUTO:5,8" with prefix_length: 1) if typo tolerance
        // is needed later. Backend C# search has the same fixes.
      },
    },
    highlight: {
      fields: {
        title: { number_of_fragments: 0 },
        ingress: { number_of_fragments: 1, fragment_size: 200 },
      },
    },
    aggs: {
      contentTypeCounts: {
        terms: {
          field: "contentType",
          size: 50,
        },
      },
    },
  };

  const contextContentTypes = getContentTypesForContext(context);
  if (contextContentTypes) {
    body.post_filter = {
      terms: {
        contentType: contextContentTypes,
      },
    };
  }

  return body;
}

function buildSuggestBody(query: string): Record<string, unknown> {
  return {
    size: 0,
    suggest: {
      "title-suggest": {
        text: query,
        completion: {
          field: "titleSuggest",
          size: 5,
          skip_duplicates: true,
          fuzzy: {
            fuzziness: "AUTO",
          },
        },
      },
    },
  };
}

function mapHitToResultItem(hit: Record<string, unknown>): SearchResultItem {
  const source = hit._source as Record<string, unknown>;
  const highlight = hit.highlight as Record<string, string[]> | undefined;

  let title = (source.title as string) ?? "";
  let ingress = (source.ingress as string) ?? "";

  if (highlight) {
    if (highlight.title) {
      title = stripEmTags(highlight.title.join(" "));
    }
    if (highlight.ingress) {
      ingress = highlight.ingress.join(" ");
    }
  }

  const contentType = (source.contentType as string) ?? "";
  const searchContext = getContextForContentType(contentType);

  return {
    type: contentType,
    title,
    ingress,
    url: (source.url as string) ?? "",
    contentGuid: (source.contentGuid as string) ?? "",
    score: (hit._score as number) ?? 0,
    hitId: (hit._id as string) ?? "",
    trackId: (hit._id as string) ?? "",
    isFallbackLanguage: false,
    parentContext: searchContext ? { value: searchContext } : null,
  };
}

function buildPageTypeFacets(
  aggregations: Record<string, unknown> | undefined,
): FacetItem[] {
  if (!aggregations) return [];

  const contentTypeCounts = aggregations.contentTypeCounts as
    | Record<string, unknown>
    | undefined;
  if (!contentTypeCounts) return [];

  const buckets = (contentTypeCounts.buckets ?? []) as Array<{
    key: string;
    doc_count: number;
  }>;

  const rawCounts = buckets.map((b) => ({
    key: b.key,
    count: b.doc_count,
  }));

  const contextCounts = groupByContext(rawCounts);
  const facets: FacetItem[] = [];

  for (const [contextName, count] of Object.entries(contextCounts)) {
    if (count > 0) {
      facets.push({ name: contextName, value: contextName, count });
    }
  }

  const allCount = Object.values(contextCounts).reduce((sum, c) => sum + c, 0);
  if (allCount > 0) {
    facets.unshift({ name: "All", value: "All", count: allCount });
  }

  return facets;
}

export async function searchPages(
  config: ElasticsearchConfig,
  query: string,
  culture: string,
  pageNumber: number,
  pageSize: number = DEFAULT_PAGE_SIZE,
  context?: string | null,
): Promise<SearchResultResponse> {
  const emptyResult: SearchResultResponse = {
    items: [],
    totalResultCount: 0,
    totalPages: 0,
    currentPageNumber: pageNumber,
    pageTypeFacets: [],
    providerFacets: [],
  };

  const indexName = getIndexName(config, culture);
  const from = (pageNumber - 1) * pageSize;
  const body = buildSearchBody(query, from, pageSize, context);

  const response = await fetch(`${config.url}/${indexName}/_search`, {
    method: "POST",
    headers: buildHeaders(config),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    console.error(
      `ES search failed: ${response.status} ${response.statusText}`,
    );
    return emptyResult;
  }

  const data = (await response.json()) as Record<string, unknown>;
  const hits = data.hits as Record<string, unknown> | undefined;
  if (!hits) return emptyResult;

  const total = hits.total as { value: number } | number | undefined;
  const totalHits = typeof total === "number" ? total : (total?.value ?? 0);

  const hitItems = (hits.hits ?? []) as Array<Record<string, unknown>>;
  const aggregations = data.aggregations as Record<string, unknown> | undefined;

  return {
    items: hitItems
      .filter((hit) => hit._source != null)
      .map(mapHitToResultItem),
    totalResultCount: totalHits,
    totalPages: Math.ceil(totalHits / pageSize),
    currentPageNumber: pageNumber,
    pageTypeFacets: buildPageTypeFacets(aggregations),
    providerFacets: [],
  };
}

export async function getSuggestions(
  config: ElasticsearchConfig,
  query: string,
  culture: string,
): Promise<SearchSuggestionResponse> {
  const emptyResult: SearchSuggestionResponse = {
    suggestions: [],
    totalHits: 0,
  };

  const indexName = getIndexName(config, culture);
  const body = buildSuggestBody(query);

  const response = await fetch(`${config.url}/${indexName}/_search`, {
    method: "POST",
    headers: buildHeaders(config),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    console.error(
      `ES suggestions failed: ${response.status} ${response.statusText}`,
    );
    return emptyResult;
  }

  const data = (await response.json()) as Record<string, unknown>;
  const suggest = data.suggest as Record<string, unknown> | undefined;
  if (!suggest) return emptyResult;

  const titleSuggest = suggest["title-suggest"] as
    | Array<Record<string, unknown>>
    | undefined;
  if (!titleSuggest) return emptyResult;

  const items: SearchSuggestionItem[] = titleSuggest
    .flatMap((entry) => (entry.options ?? []) as Array<Record<string, unknown>>)
    .map((option) => {
      const source = option._source as Record<string, unknown> | undefined;
      return {
        title: (source?.title as string) ?? (option.text as string) ?? "",
        url: (source?.url as string) ?? "",
      };
    });

  return {
    suggestions: items,
    totalHits: items.length,
  };
}
