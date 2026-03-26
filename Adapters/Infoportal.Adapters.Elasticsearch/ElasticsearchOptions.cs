namespace Infoportal.Adapters.Elasticsearch;

public class ElasticsearchOptions
{
    // TODO: In production, override Url and ApiKey via deployment.yaml env vars:
    // ElasticsearchOptions__Url and ElasticsearchOptions__ApiKey (FluxCD substitution)
    public string Url { get; set; } = "http://localhost:9200";
    public string IndexPrefix { get; set; } = "infoportal";
    public string? ApiKey { get; set; }
    public int PageSize { get; set; } = 10;

    public List<string> ExcludedProperties { get; set; } =
    [
        "umbracoUrlName",
        "canonicalUrl",
        "showInNavigation"
    ];
}
