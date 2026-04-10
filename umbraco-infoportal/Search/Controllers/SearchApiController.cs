using Infoportal.Adapters.Elasticsearch.Models;
using Infoportal.Adapters.Elasticsearch.Services;
using Microsoft.AspNetCore.Mvc;

namespace umbraco_infoportal.Search.Controllers;

[ApiController]
[Route("api/search/{language}")]
public class SearchApiController : ControllerBase
{
    private readonly ISearchService _searchService;
    private readonly ILogger<SearchApiController> _logger;

    private const int DefaultPageSize = 10;
    private const int MaxPageNumber = 100;
    private const int MaxQueryLength = 200;
    private static readonly HashSet<string> SupportedLanguages = ["nb", "nn", "en"];

    public SearchApiController(
        ISearchService searchService,
        ILogger<SearchApiController> logger)
    {
        _searchService = searchService;
        _logger = logger;
    }

    [HttpGet("page")]
    public async Task<IActionResult> GetSearchPages(
        [FromRoute] string language,
        [FromQuery(Name = "q")] string? query,
        [FromQuery(Name = "pagenumber")] int pageNumber = 1,
        [FromQuery(Name = "context")] string? context = null,
        CancellationToken ct = default)
    {
        if (!SupportedLanguages.Contains(language))
            return BadRequest(new { error = $"Unsupported language: {language}" });

        if (string.IsNullOrWhiteSpace(query))
            return Ok(new SearchResultResponse { CurrentPageNumber = 1 });

        query = SanitizeQuery(query);
        pageNumber = Math.Clamp(pageNumber, 1, MaxPageNumber);

        var result = await _searchService.SearchAsync(
            query, language, pageNumber, DefaultPageSize, context, ct);

        return Ok(result);
    }

    [HttpGet("suggestions")]
    public async Task<IActionResult> GetSuggestions(
        [FromRoute] string language,
        [FromQuery(Name = "q")] string? query,
        CancellationToken ct = default)
    {
        if (!SupportedLanguages.Contains(language))
            return BadRequest(new { error = $"Unsupported language: {language}" });

        if (string.IsNullOrWhiteSpace(query) || query.Length < 2)
            return Ok(new SearchSuggestionResponse());

        query = SanitizeQuery(query);

        var result = await _searchService.GetSuggestionsAsync(query, language, ct);
        return Ok(result);
    }

    // TODO: Click tracking endpoint — records which result a user clicked for ranking improvement.
    // Optimizely has TrackClick(query, hitId, trackId) called from a GET /{language}/goto/{id}
    // redirect endpoint that tracks the click before redirecting to the actual page URL.
    // [HttpGet("goto/{id}")]
    // public IActionResult GoToResult(string language, int id, string? query, string? hitId, string? trackId)
    // {
    //     if (!string.IsNullOrEmpty(query) && !string.IsNullOrEmpty(hitId))
    //         _searchService.TrackClick(query, hitId, trackId);
    //     var url = resolveContentUrl(id, language);
    //     return Redirect(url);
    // }

    private static string SanitizeQuery(string query)
    {
        if (query.Length > MaxQueryLength)
            query = query[..MaxQueryLength];

        return query.Trim();
    }
}
