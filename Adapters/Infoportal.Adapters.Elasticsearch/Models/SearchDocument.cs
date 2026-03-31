using System.Text.Json.Serialization;

namespace Infoportal.Adapters.Elasticsearch.Models;

public class SearchDocument
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = "";

    [JsonPropertyName("contentId")]
    public int ContentId { get; set; }

    [JsonPropertyName("contentGuid")]
    public Guid ContentGuid { get; set; }

    [JsonPropertyName("title")]
    public string Title { get; set; } = "";

    [JsonPropertyName("ingress")]
    public string Ingress { get; set; } = "";

    [JsonPropertyName("body")]
    public string Body { get; set; } = "";

    [JsonPropertyName("url")]
    public string Url { get; set; } = "";

    [JsonPropertyName("contentType")]
    public string ContentType { get; set; } = "";

    [JsonPropertyName("culture")]
    public string Culture { get; set; } = "";

    [JsonPropertyName("publishDate")]
    public DateTime? PublishDate { get; set; }

    [JsonPropertyName("updateDate")]
    public DateTime? UpdateDate { get; set; }

    [JsonPropertyName("titleSuggest")]
    public string[] TitleSuggest { get; set; } = [];
}
