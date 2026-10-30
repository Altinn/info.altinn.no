using Infoportal.Cms.Search.Models;


namespace Infoportal.Cms.Search.Services;

public interface ISearchService
{
    Task EnsureIndexExistsAsync(string culture, CancellationToken ct = default);
    Task IndexDocumentAsync(SearchDocument document, CancellationToken ct = default);
    // Zero-downtime full reindex: build a fresh index per culture, then swap the
    // public alias over to it. Incremental updates also go to the fresh index meanwhile.
    Task<string> CreateReindexTargetAsync(string culture, CancellationToken ct = default);
    Task IndexDocumentIntoAsync(string indexName, SearchDocument document, CancellationToken ct = default);
    Task SwapToReindexTargetAsync(string culture, CancellationToken ct = default);
    Task AbortReindexTargetAsync(string culture, CancellationToken ct = default);
    Task DeleteDocumentAsync(int contentId, string culture, CancellationToken ct = default);
    Task DeleteDocumentAllCulturesAsync(int contentId, CancellationToken ct = default);
    // Removes documents for the content item that are no longer produced, e.g. deleted help sections.
    Task DeleteStaleDocumentsAsync(
        int contentId, string culture, IReadOnlyCollection<string> currentDocumentIds,
        CancellationToken ct = default);
    Task<SearchResultResponse> SearchAsync(
        string query, string culture, int pageNumber, int pageSize,
        string? context = null, CancellationToken ct = default);
    Task<SearchSuggestionResponse> GetSuggestionsAsync(
        string query, string culture, CancellationToken ct = default);

    // TODO: Click tracking — track which search results users click on to improve ranking
    // Reference: Optimizely's TrackClick(query, hitId, trackId) + Statistics().TrackHit()
    // void TrackClick(string query, string hitId, string trackId);
}
