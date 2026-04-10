using System.Text.Json.Serialization;

namespace Infoportal.Adapters.Elasticsearch.Models;

public class SearchResultResponse
{
    [JsonPropertyName("items")]
    public List<SearchResultItem> Items { get; set; } = [];

    [JsonPropertyName("totalResultCount")]
    public int TotalResultCount { get; set; }

    [JsonPropertyName("totalPages")]
    public int TotalPages { get; set; }

    [JsonPropertyName("currentPageNumber")]
    public int CurrentPageNumber { get; set; }

    [JsonPropertyName("pageTypeFacets")]
    public List<FacetItem> PageTypeFacets { get; set; } = [];

    [JsonPropertyName("providerFacets")]
    public List<FacetItem> ProviderFacets { get; set; } = [];

    // TODO: Spellcheck suggestion — when search returns 0 results, populate this with
    // a corrected query term so the frontend can show "Mente du: <suggestionTerm>?"
    // Optimizely returns this via SuggestionTerm when hits < SpellcheckHitsCutoff.
    // [JsonPropertyName("suggestionTerm")]
    // public string? SuggestionTerm { get; set; }
}

public class SearchResultItem
{
    [JsonPropertyName("type")]
    public string Type { get; set; } = "";

    [JsonPropertyName("title")]
    public string Title { get; set; } = "";

    [JsonPropertyName("ingress")]
    public string Ingress { get; set; } = "";

    [JsonPropertyName("url")]
    public string Url { get; set; } = "";

    [JsonPropertyName("contentGuid")]
    public string ContentGuid { get; set; } = "";

    [JsonPropertyName("score")]
    public double Score { get; set; }

    [JsonPropertyName("hitId")]
    public string HitId { get; set; } = "";

    [JsonPropertyName("trackId")]
    public string TrackId { get; set; } = "";

    [JsonPropertyName("isFallbackLanguage")]
    public bool IsFallbackLanguage { get; set; }

    [JsonPropertyName("parentContext")]
    public ParentContext? ParentContext { get; set; }
}

public class ParentContext
{
    [JsonPropertyName("value")]
    public string? Value { get; set; }
}

public class FacetItem
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = "";

    [JsonPropertyName("value")]
    public string Value { get; set; } = "";

    [JsonPropertyName("count")]
    public long Count { get; set; }
}
