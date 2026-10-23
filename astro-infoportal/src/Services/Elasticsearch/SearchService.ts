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
// Note: this path also adds semantic hits (see fetchSemanticHits); the C# SearchAsync
// is lexical-only, so only the lexical multi_match query mirrors it.
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

// semantic_text field (inference endpoint e5-large-incluster) holding the meaningful
// title, ingress and metaDescription values (not body). Mapping and values are set in
// ElasticsearchSearchService.cs (EnsureIndexExistsAsync, IndexDocumentAsync).
const SEMANTIC_FIELD = "bodySemantic";

// Keyword search drives results, totals, facets and paging. On page 1, semantic
// hits that keyword search missed are appended, but only relevant ones.
// A fixed similarity threshold doesn't work with E5: unrelated pages score in the
// same narrow band (~0.76–0.87 cosine) as relevant ones, and the band shifts per
// query. Instead the SEMANTIC_CANDIDATE_COUNT-th candidate's cosine is used as the
// query's noise floor, and a hit is kept only if it beats the floor by
// SEMANTIC_RELEVANCE_MARGIN. In local tests on at22 pages (paraphrase and unrelated
// queries), 0.03 kept the right page in about half the cases and almost nothing
// for unrelated queries; 0.02 let noise through, 0.04 dropped most right pages.
const SEMANTIC_CANDIDATE_COUNT = 20;
const SEMANTIC_NUM_CANDIDATES = 100;
const SEMANTIC_RELEVANCE_MARGIN = 0.03;
// Upper bound only; usually 0–2 hits pass the relevance rule.
const SEMANTIC_MAX_HITS = 5;

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

function buildLexicalQuery(query: string): Record<string, unknown> {
  return {
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
    query: buildLexicalQuery(query),
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

// knn on a semantic_text field embeds the query with the field's inference
// endpoint. The pre-filter excludes pages the lexical query matches, so the
// semantic hits never duplicate keyword results on any page, and applies the
// same context filter as the lexical search.
function buildSemanticBody(
  query: string,
  context: string | null | undefined,
): Record<string, unknown> {
  const filter: Record<string, unknown> = {
    must_not: [buildLexicalQuery(query)],
  };

  const contextContentTypes = getContentTypesForContext(context);
  if (contextContentTypes) {
    filter.filter = [{ terms: { contentType: contextContentTypes } }];
  }

  return {
    size: SEMANTIC_CANDIDATE_COUNT,
    _source: { excludes: ["body", SEMANTIC_FIELD] },
    query: {
      knn: {
        field: SEMANTIC_FIELD,
        k: SEMANTIC_CANDIDATE_COUNT,
        num_candidates: SEMANTIC_NUM_CANDIDATES,
        query_vector_builder: {
          text_embedding: { model_text: query },
        },
        filter: { bool: filter },
      },
    },
  };
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

function postSearch(
  config: ElasticsearchConfig,
  culture: string,
  body: Record<string, unknown>,
): Promise<Response> {
  return fetch(`${config.url}/${getIndexName(config, culture)}/_search`, {
    method: "POST",
    headers: buildHeaders(config),
    body: JSON.stringify(body),
  });
}

// Keeps the candidates that stand out from the query's noise floor (see
// SEMANTIC_RELEVANCE_MARGIN). Hits must be sorted by score, as ES returns them.
// knn _score for cosine is (1 + cosine) / 2, so it is converted back to cosine.
export function selectRelevantSemanticHits(
  hits: Array<Record<string, unknown>>,
): Array<Record<string, unknown>> {
  // Too few candidates (e.g. a small context) to estimate the noise floor.
  if (hits.length < SEMANTIC_CANDIDATE_COUNT) return [];

  const cosine = (hit: Record<string, unknown>) =>
    2 * ((hit._score as number) ?? 0) - 1;
  const floor = cosine(hits[SEMANTIC_CANDIDATE_COUNT - 1]);

  return hits
    .filter((hit) => cosine(hit) >= floor + SEMANTIC_RELEVANCE_MARGIN)
    .slice(0, SEMANTIC_MAX_HITS);
}

// Returns the relevant semantic hits that the lexical query missed, or [] if the
// semantic search fails (e.g. inference endpoint unavailable), so keyword
// search keeps working on its own.
async function fetchSemanticHits(
  config: ElasticsearchConfig,
  query: string,
  culture: string,
  context: string | null | undefined,
): Promise<SearchResultItem[]> {
  try {
    const response = await postSearch(
      config,
      culture,
      buildSemanticBody(query, context),
    );
    if (!response.ok) {
      console.warn(
        `ES semantic search failed: ${response.status} ${await response.text()}`,
      );
      return [];
    }

    const data = (await response.json()) as Record<string, unknown>;
    const hits = data.hits as Record<string, unknown> | undefined;
    const hitItems = (hits?.hits ?? []) as Array<Record<string, unknown>>;
    return selectRelevantSemanticHits(hitItems)
      .filter((hit) => hit._source != null)
      .map(mapHitToResultItem);
  } catch (error) {
    console.warn("ES semantic search failed:", error);
    return [];
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

  const from = (pageNumber - 1) * pageSize;

  // Semantic hits are only added to page 1, so later pages page through
  // keyword results exactly as before.
  const [response, semanticItems] = await Promise.all([
    postSearch(config, culture, buildSearchBody(query, from, pageSize, context)),
    pageNumber === 1
      ? fetchSemanticHits(config, query, culture, context)
      : Promise.resolve([]),
  ]);

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

  const lexicalItems = hitItems
    .filter((hit) => hit._source != null)
    .map(mapHitToResultItem);

  return {
    // Semantic hits go after the keyword hits, so exact matches stay on top.
    items: [...lexicalItems, ...semanticItems],
    totalResultCount: totalHits + semanticItems.length,
    totalPages: Math.max(
      Math.ceil(totalHits / pageSize),
      semanticItems.length > 0 ? 1 : 0,
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
