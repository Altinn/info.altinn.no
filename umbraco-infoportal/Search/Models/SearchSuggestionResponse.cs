using System.Text.Json.Serialization;

namespace Infoportal.Cms.Search.Models;

public class SearchSuggestionResponse
{
    [JsonPropertyName("suggestions")]
    public List<SearchSuggestionItem> Suggestions { get; set; } = [];

    [JsonPropertyName("totalHits")]
    public int TotalHits { get; set; }
}

public class SearchSuggestionItem
{
    [JsonPropertyName("title")]
    public string Title { get; set; } = "";

    [JsonPropertyName("url")]
    public string Url { get; set; } = "";
}
