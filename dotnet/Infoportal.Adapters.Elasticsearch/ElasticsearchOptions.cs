namespace Infoportal.Adapters.Elasticsearch;

public class ElasticsearchOptions
{
    // Bound to configuration section "Elasticsearch". In cloud environments,
    // Endpoint and ApiKey are injected via Elasticsearch__Endpoint and
    // Elasticsearch__ApiKey env vars sourced from a K8s secret synced from
    // Azure Key Vault by External Secrets Operator.
    public string Endpoint { get; set; } = "";
    public string IndexPrefix { get; set; } = "";
    public string? ApiKey { get; set; }
    public int PageSize { get; set; } = 10;

    public List<string> ExcludedProperties { get; set; } =
    [
        "umbracoUrlName",
        "canonicalUrl",
        "showInNavigation"
    ];
}
