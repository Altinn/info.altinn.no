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

// Field weights mirror legacy Optimizely RelativeImportance.xml intent
// (title/metaTitle highest, curated keywords next, ingress, then description, then body).
// IMPORTANT: keep in sync with
//   Adapters/Infoportal.Adapters.Elasticsearch/Services/ElasticsearchSearchService.cs SearchFields.
// This is the user-facing query path; the C# SearchAsync is only for backend/admin use.
// Note: this path runs hybrid (lexical + semantic, RRF) search; the C# SearchAsync is
// still lexical-only, so only the lexical multi_match part mirrors it.
//
// bestBetTriggers carries editorial trigger phrases (dialect, deprecated terms,
// synonyms) that may not appear in the page itself. Highest boost so pages with
// matching triggers rank above fuzzy hits. See umbraco-infoportal/Search/BestBets/.
const SEARCH_FIELDS = [
  "title^3",
  "metaTitle^3",
  "metaKeywords^2.5",
  "ingress^2",
  "metaDescription^1.5",
  "body",
  "bestBetTriggers^5",
];
const DEFAULT_PAGE_SIZE = 10;

// semantic_text field (inference endpoint e5-large-incluster) populated via copy_to
// from title, ingress, metaDescription and body. Mapping is defined in
// ElasticsearchSearchService.cs EnsureIndexExistsAsync.
const SEMANTIC_FIELD = "bodySemantic";

// Hybrid search fuses the lexical and semantic result lists with Reciprocal Rank
// Fusion. Only the top RANK_WINDOW_SIZE fused hits can be paged through
// (from + size beyond the window returns no hits), so it must stay constant across
// pages for consistent paging. RANK_CONSTANT is the ES default.
const RANK_WINDOW_SIZE = 100;
const RANK_CONSTANT = 60;

// Minimum raw cosine similarity for a semantic hit (not the _score). Without it the
// semantic retriever returns the RANK_WINDOW_SIZE nearest pages for any query, however
// unrelated. E5 similarities sit in a high, narrow band (unrelated text often scores
// ~0.7–0.75), so 0.80 is a conservative starting point. Tune against real queries.
const SEMANTIC_MIN_SIMILARITY = 0.8;
const SEMANTIC_NUM_CANDIDATES = 2 * RANK_WINDOW_SIZE;

// RRF weights. Lexical is weighted higher so exact keyword matches stay on top and
// semantic hits mainly fill in pages the keywords miss.
const LEXICAL_WEIGHT = 2.0;
const SEMANTIC_WEIGHT = 1.0;

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
  hybrid: boolean,
): Record<string, unknown> {
  const lexicalQuery = {
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
  };

  // knn on a semantic_text field embeds the query with the field's inference
  // endpoint. Used instead of match so a similarity threshold can be applied.
  const semanticQuery = {
    knn: {
      field: SEMANTIC_FIELD,
      k: RANK_WINDOW_SIZE,
      num_candidates: SEMANTIC_NUM_CANDIDATES,
      similarity: SEMANTIC_MIN_SIMILARITY,
      query_vector_builder: {
        text_embedding: { model_text: query },
      },
    },
  };

  const ranking = hybrid
    ? {
        retriever: {
          rrf: {
            retrievers: [
              {
                retriever: { standard: { query: lexicalQuery } },
                weight: LEXICAL_WEIGHT,
              },
              {
                retriever: { standard: { query: semanticQuery } },
                weight: SEMANTIC_WEIGHT,
              },
            ],
            rank_window_size: RANK_WINDOW_SIZE,
            rank_constant: RANK_CONSTANT,
          },
        },
      }
    : { query: lexicalQuery };

  const body: Record<string, unknown> = {
    from,
    size,
    ...ranking,
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

// Returns the parsed hybrid response, or null if it failed and lexical search
// should be used instead. Shard failures count as failure: inference errors can
// surface as a 200 with failed shards and partial (lexical-skewed) results.
async function runHybridSearch(
  runSearch: (hybrid: boolean) => Promise<Response>,
): Promise<Record<string, unknown> | null> {
  try {
    const response = await runSearch(true);
    if (!response.ok) {
      console.warn(
        `ES hybrid search failed, falling back to lexical: ${response.status} ${await response.text()}`,
      );
      return null;
    }

    const data = (await response.json()) as Record<string, unknown>;
    const shards = data._shards as { failed?: number } | undefined;
    if (shards?.failed) {
      console.warn(
        `ES hybrid search had ${shards.failed} failed shard(s), falling back to lexical`,
      );
      return null;
    }

    return data;
  } catch (error) {
    console.warn("ES hybrid search failed, falling back to lexical:", error);
    return null;
  }
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

  const searchUrl = `${config.url}/${getIndexName(config, culture)}/_search`;
  const from = (pageNumber - 1) * pageSize;

  const runSearch = (hybrid: boolean) =>
    fetch(searchUrl, {
      method: "POST",
      headers: buildHeaders(config),
      body: JSON.stringify(
        buildSearchBody(query, from, pageSize, context, hybrid),
      ),
    });

  // Try hybrid first; fall back to lexical-only if the semantic part fails
  // (e.g. inference endpoint unavailable or index missing the semantic field).
  let data = await runHybridSearch(runSearch);
  const hybrid = data != null;

  if (!data) {
    const response = await runSearch(false);
    if (!response.ok) {
      console.error(
        `ES search failed: ${response.status} ${response.statusText}`,
      );
      return emptyResult;
    }
    data = (await response.json()) as Record<string, unknown>;
  }

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
    // With hybrid, pages beyond the RRF rank window would come back empty.
    totalPages: Math.ceil(
      (hybrid ? Math.min(totalHits, RANK_WINDOW_SIZE) : totalHits) / pageSize,
    ),
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
