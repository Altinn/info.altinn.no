using Elastic.Clients.Elasticsearch;
using Elastic.Clients.Elasticsearch.Analysis;
using Elastic.Clients.Elasticsearch.Core.Search;
using Elastic.Clients.Elasticsearch.Mapping;
using Elastic.Clients.Elasticsearch.QueryDsl;
using Infoportal.Adapters.Elasticsearch.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Infoportal.Adapters.Elasticsearch.Services;

public class ElasticsearchSearchService : ISearchService
{
    private readonly ElasticsearchClient _client;
    private readonly ElasticsearchOptions _options;
    private readonly ILogger<ElasticsearchSearchService> _logger;
    private static readonly HashSet<string> _createdIndices = [];
    private static readonly string[] SupportedCultures = ["nb", "nn", "en"];

    // TODO: Configurable field weights — Optimizely stores these in XML (RelativeImportance.xml)
    // with per-field weights for title, ingress, body, metaKeywords, metaDescription.
    // Consider moving to appsettings.json or a separate config when fine-tuning is needed.
    private static readonly Fields SearchFields = new[] { "title^3", "ingress^2", "body" };

    public ElasticsearchSearchService(
        ElasticsearchClientFactory clientFactory,
        IOptions<ElasticsearchOptions> options,
        ILogger<ElasticsearchSearchService> logger)
    {
        _client = clientFactory.GetClient();
        _options = options.Value;
        _logger = logger;
    }

    private string GetIndexName(string culture) =>
        $"{_options.IndexPrefix}-{culture.ToLowerInvariant()}";

    private static string GetAnalyzerName(string culture) => culture switch
    {
        "nb" or "nn" => "norwegian",
        "en" => "english",
        _ => "standard"
    };

    public async Task EnsureIndexExistsAsync(string culture, CancellationToken ct = default)
    {
        var indexName = GetIndexName(culture);
        if (_createdIndices.Contains(indexName))
            return;

        try
        {
            var existsResponse = await _client.Indices.ExistsAsync(indexName, ct);
            if (existsResponse.Exists)
            {
                _createdIndices.Add(indexName);
                return;
            }

            var analyzerName = GetAnalyzerName(culture);

            var createResponse = await _client.Indices.CreateAsync(indexName, c => c
                .Mappings(m => m
                    .Properties(p => p
                        .Keyword("id")
                        .IntegerNumber("contentId")
                        .Keyword("contentGuid")
                        .Text("title", t => t.Analyzer(analyzerName))
                        .Text("ingress", t => t.Analyzer(analyzerName))
                        .Text("body", t => t.Analyzer(analyzerName))
                        .Keyword("url")
                        .Keyword("contentType")
                        .Keyword("culture")
                        .Date("publishDate")
                        .Date("updateDate")
                        .Completion("titleSuggest")
                    )
                ), ct);

            if (createResponse.IsValidResponse)
            {
                _createdIndices.Add(indexName);
                _logger.LogInformation("Created Elasticsearch index {IndexName}", indexName);
            }
            else
            {
                _logger.LogWarning(
                    "Failed to create index {IndexName}: {Error}",
                    indexName, createResponse.DebugInformation);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not ensure index {IndexName} exists", indexName);
        }
    }

    public async Task DeleteIndexAsync(string culture, CancellationToken ct = default)
    {
        var indexName = GetIndexName(culture);
        try
        {
            var response = await _client.Indices.DeleteAsync(indexName, ct);
            if (response.IsValidResponse)
            {
                _createdIndices.Remove(indexName);
                _logger.LogInformation("Deleted Elasticsearch index {IndexName}", indexName);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to delete index {IndexName}", indexName);
        }
    }

    public async Task IndexDocumentAsync(SearchDocument document, CancellationToken ct = default)
    {
        try
        {
            await EnsureIndexExistsAsync(document.Culture, ct);
            var indexName = GetIndexName(document.Culture);

            var response = await _client.IndexAsync(document, i => i
                .Index(indexName)
                .Id(document.Id), ct);

            if (!response.IsValidResponse)
            {
                _logger.LogWarning(
                    "Failed to index document {DocumentId}: {Error}",
                    document.Id, response.DebugInformation);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to index document {DocumentId}", document.Id);
        }
    }

    public async Task DeleteDocumentAsync(int contentId, string culture, CancellationToken ct = default)
    {
        try
        {
            var indexName = GetIndexName(culture);
            var docId = $"{contentId}_{culture}";
            var response = await _client.DeleteAsync(indexName, docId, ct);

            if (!response.IsValidResponse && response.Result != Result.NotFound)
            {
                _logger.LogWarning(
                    "Failed to delete document {DocumentId}: {Error}",
                    docId, response.DebugInformation);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to delete document for content {ContentId}", contentId);
        }
    }

    public async Task DeleteDocumentAllCulturesAsync(int contentId, CancellationToken ct = default)
    {
        foreach (var culture in SupportedCultures)
        {
            await DeleteDocumentAsync(contentId, culture, ct);
        }
    }

    public async Task<SearchResultResponse> SearchAsync(
        string query, string culture, int pageNumber, int pageSize,
        string? context = null, CancellationToken ct = default)
    {
        var emptyResult = new SearchResultResponse { CurrentPageNumber = pageNumber };

        try
        {
            var indexName = GetIndexName(culture);
            var from = (pageNumber - 1) * pageSize;

            var searchResponse = await _client.SearchAsync<SearchDocument>(s =>
            {
                s.Indices(indexName)
                    .From(from)
                    .Size(pageSize)
                    .Highlight(h => h
                        .AddField("title", new HighlightField { NumberOfFragments = 0 })
                        .AddField("ingress", new HighlightField { NumberOfFragments = 1, FragmentSize = 200 })
                    );

                // TODO: Exact/quoted search — if query contains double quotes, disable fuzziness
                // and stemming to match exact phrases. Optimizely uses Language.None + WithAndAsDefaultOperator.

                // TODO: Per-pagetype score boosting — Optimizely applies configurable BoostMatching()
                // per content type. Can be implemented with ES function_score query.

                // TODO: Freshness decay — ES function_score with decay functions on publishDate.

                // Base query: full-text match (aggregations run on this, unfiltered by context)
                s.Query(q => q.MultiMatch(mm => mm
                    .Query(query)
                    .Fields(SearchFields)
                    .Type(TextQueryType.BestFields)
                    .Fuzziness(new Fuzziness("AUTO"))
                ));

                // Context filter applied via post_filter so aggregations count across ALL contexts
                var contextContentTypes = SearchContextMapping.GetContentTypesForContext(context);
                if (contextContentTypes != null)
                {
                    var fieldValues = contextContentTypes.Select(t => FieldValue.String(t)).ToList();
                    s.PostFilter(f => f.Terms(t => t
                        .Field("contentType")
                        .Terms(new TermsQueryField(fieldValues))
                    ));
                }

                // Aggregations for facet counts
                s.Aggregations(a => a
                    .Add("contentTypeCounts", agg => agg
                        .Terms(t => t.Field("contentType").Size(50))
                    )
                );
            }, ct);

            if (!searchResponse.IsValidResponse)
            {
                _logger.LogWarning(
                    "Search failed for query '{Query}': {Error}",
                    SanitizeForLog(query), searchResponse.DebugInformation);
                return emptyResult;
            }

            var totalHits = searchResponse.Total;

            // Build facet counts from aggregations
            var pageTypeFacets = BuildPageTypeFacets(searchResponse);

            // TODO: Spellcheck / "did you mean" — when totalHits == 0, suggest corrected query.
            // TODO: Result caching — IMemoryCache with short TTL.

            return new SearchResultResponse
            {
                Items = searchResponse.Hits
                    .Where(hit => hit.Source != null)
                    .Select(hit => MapHitToResultItem(hit)).ToList(),
                TotalResultCount = (int)totalHits,
                TotalPages = (int)Math.Ceiling((double)totalHits / pageSize),
                CurrentPageNumber = pageNumber,
                PageTypeFacets = pageTypeFacets,
            };
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Search failed for query '{Query}'", SanitizeForLog(query));
            return emptyResult;
        }
    }

    public async Task<SearchSuggestionResponse> GetSuggestionsAsync(
        string query, string culture, CancellationToken ct = default)
    {
        var emptyResult = new SearchSuggestionResponse();

        try
        {
            var indexName = GetIndexName(culture);

            var response = await _client.SearchAsync<SearchDocument>(s =>
            {
                s.Indices(indexName)
                    .Size(0)
                    .Suggest(su => su
                        .Text(query)
                        .Suggesters(sg => sg
                            .Add("title-suggest", ts => ts
                                .Completion(c => c
                                    .Field("titleSuggest")
                                    .Size(5)
                                    .SkipDuplicates(true)
                                    .Fuzzy(f => f.Fuzziness(new Fuzziness("AUTO")))
                                )
                            )
                        )
                    );
            }, ct);

            if (!response.IsValidResponse || response.Suggest == null)
                return emptyResult;

            var completions = response.Suggest.GetCompletion("title-suggest");
            if (completions == null)
                return emptyResult;

            var items = completions
                .SelectMany(c => c.Options)
                .Select(o => new SearchSuggestionItem
                {
                    Title = o.Source?.Title ?? o.Text ?? "",
                    Url = o.Source?.Url ?? ""
                })
                .ToList();

            return new SearchSuggestionResponse
            {
                Suggestions = items,
                TotalHits = items.Count
            };
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Suggestions failed for query '{Query}'", SanitizeForLog(query));
            return emptyResult;
        }
    }

    private static string SanitizeForLog(string? value) =>
        value?.Replace("\r", " ").Replace("\n", " ") ?? "";

    private static List<FacetItem> BuildPageTypeFacets(SearchResponse<SearchDocument> searchResponse)
    {
        var facets = new List<FacetItem>();

        if (searchResponse.Aggregations == null)
            return facets;

        if (!searchResponse.Aggregations.TryGetValue("contentTypeCounts", out var agg))
            return facets;

        if (agg is not Elastic.Clients.Elasticsearch.Aggregations.StringTermsAggregate termsAgg)
            return facets;

        // Extract raw content type counts from ES buckets
        var rawCounts = termsAgg.Buckets
            .Select(b => new KeyValuePair<string, long>(b.Key.ToString(), b.DocCount))
            .ToList();

        // Group by search context (StartCompany, Schema, Help)
        var contextCounts = SearchContextMapping.GroupByContext(rawCounts);

        // Build facet list — only include contexts with results
        foreach (var (contextName, count) in contextCounts)
        {
            if (count > 0)
            {
                facets.Add(new FacetItem
                {
                    Name = contextName,
                    Value = contextName,
                    Count = count
                });
            }
        }

        // Add "All" as the sum of all context counts (if any results exist)
        var allCount = contextCounts.Values.Sum();
        if (allCount > 0)
        {
            facets.Insert(0, new FacetItem
            {
                Name = nameof(SearchContext.All),
                Value = nameof(SearchContext.All),
                Count = allCount
            });
        }

        return facets;
    }

    private static string StripEmTags(string text) =>
        text.Replace("<em>", "").Replace("</em>", "");

    private static SearchResultItem MapHitToResultItem(Hit<SearchDocument> hit)
    {
        var source = hit.Source!;
        var title = source.Title;
        var ingress = source.Ingress;

        // Use highlighted ingress from ES (frontend renders it as HTML).
        // Strip <em> tags from title since the frontend highlights it client-side as plain text.
        if (hit.Highlight != null)
        {
            if (hit.Highlight.TryGetValue("title", out var titleHighlight))
                title = StripEmTags(string.Join(" ", titleHighlight));
            if (hit.Highlight.TryGetValue("ingress", out var ingressHighlight))
                ingress = string.Join(" ", ingressHighlight);
        }

        var searchContext = SearchContextMapping.GetContextForContentType(source.ContentType);

        return new SearchResultItem
        {
            Type = source.ContentType,
            Title = title,
            Ingress = ingress,
            Url = source.Url,
            ContentGuid = source.ContentGuid.ToString(),
            Score = hit.Score ?? 0,
            HitId = hit.Id ?? "",
            TrackId = hit.Id ?? "",
            IsFallbackLanguage = false,
            ParentContext = searchContext != null ? new ParentContext
            {
                Value = searchContext
            } : null
        };
    }
}
