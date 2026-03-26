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
                // Example: if (query.Contains('"')) use TextQueryType.Phrase with no fuzziness.

                // TODO: Per-pagetype score boosting — Optimizely applies configurable BoostMatching()
                // per content type (e.g., themePage boost 1.5, newsArticlePage boost 1.2).
                // Can be implemented with ES function_score query wrapping the multi_match.

                // TODO: Freshness decay — Optimizely uses date decay to rank newer content higher.
                // ES supports this via function_score with decay functions:
                // .Functions(f => f.Exp(e => e.Field("publishDate").Decay(0.5).Scale("30d").Offset("7d")))

                // TODO: Provider filtering — when SchemaPage content type exists, add:
                // 1. "providers" parameter to SearchAsync() and ISearchService
                // 2. "providerNames" keyword field on SearchDocument + index mapping
                // 3. Terms filter: b.Filter(f => f.Terms(t => t.Field("providerNames").Terms(...)))
                // 4. Terms aggregations on "contentType" and "providerNames" for facet counts
                // Provider filtering applies only to schema pages, not article pages.

                if (!string.IsNullOrEmpty(context) && context != "All")
                {
                    s.Query(q => q.Bool(b => b
                        .Must(
                            m => m.MultiMatch(mm => mm
                                .Query(query)
                                .Fields(SearchFields)
                                .Type(TextQueryType.BestFields)
                                .Fuzziness(new Fuzziness("AUTO"))
                            ),
                            m => m.Term(t => t.Field("contentType").Value(context))
                        )
                    ));
                }
                else
                {
                    s.Query(q => q.MultiMatch(mm => mm
                        .Query(query)
                        .Fields(SearchFields)
                        .Type(TextQueryType.BestFields)
                        .Fuzziness(new Fuzziness("AUTO"))
                    ));
                }
            }, ct);

            if (!searchResponse.IsValidResponse)
            {
                _logger.LogWarning(
                    "Search failed for query '{Query}': {Error}",
                    SanitizeForLog(query), searchResponse.DebugInformation);
                return emptyResult;
            }

            var totalHits = searchResponse.Total;

            // TODO: Spellcheck / "did you mean" — when totalHits == 0, run a second query
            // with ES suggest API (term suggester) to propose corrected spellings.
            // Optimizely returns a SuggestionTerm when results < SpellcheckHitsCutoff (3).
            // Return the suggestion in SearchResultResponse so the frontend can show
            // "Fant ingen resultater. Mente du: <suggestion>?"

            // TODO: Result caching — Optimizely caches results for 30 seconds.
            // Consider IMemoryCache with a short TTL keyed on (query, culture, page, context).

            return new SearchResultResponse
            {
                Items = searchResponse.Hits
                    .Where(hit => hit.Source != null)
                    .Select(hit => MapHitToResultItem(hit)).ToList(),
                TotalResultCount = (int)totalHits,
                TotalPages = (int)Math.Ceiling((double)totalHits / pageSize),
                CurrentPageNumber = pageNumber
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

    private static SearchResultItem MapHitToResultItem(Hit<SearchDocument> hit)
    {
        var source = hit.Source!;
        var title = source.Title;
        var ingress = source.Ingress;

        if (hit.Highlight != null)
        {
            if (hit.Highlight.TryGetValue("title", out var titleHighlight))
                title = string.Join(" ", titleHighlight);
            if (hit.Highlight.TryGetValue("ingress", out var ingressHighlight))
                ingress = string.Join(" ", ingressHighlight);
        }

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
            IsFallbackLanguage = false
        };
    }
}
