using Infoportal.Adapters.Elasticsearch.Models;

namespace Infoportal.Adapters.Elasticsearch.Services;

public interface ISearchService
{
    Task EnsureIndexExistsAsync(string culture, CancellationToken ct = default);
    Task DeleteIndexAsync(string culture, CancellationToken ct = default);
    Task IndexDocumentAsync(SearchDocument document, CancellationToken ct = default);
    Task DeleteDocumentAsync(int contentId, string culture, CancellationToken ct = default);
    Task DeleteDocumentAllCulturesAsync(int contentId, CancellationToken ct = default);
    Task<SearchResultResponse> SearchAsync(
        string query, string culture, int pageNumber, int pageSize,
        string? context = null, CancellationToken ct = default);
    Task<SearchSuggestionResponse> GetSuggestionsAsync(
        string query, string culture, CancellationToken ct = default);

    // TODO: Click tracking — track which search results users click on to improve ranking
    // Reference: Optimizely's TrackClick(query, hitId, trackId) + Statistics().TrackHit()
    // void TrackClick(string query, string hitId, string trackId);
}
