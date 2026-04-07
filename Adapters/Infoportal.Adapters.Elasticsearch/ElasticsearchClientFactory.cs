using Elastic.Clients.Elasticsearch;
using Elastic.Transport;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Infoportal.Adapters.Elasticsearch;

public class ElasticsearchClientFactory
{
    private readonly ElasticsearchClient _client;

    public ElasticsearchClientFactory(
        IOptions<ElasticsearchOptions> options,
        ILogger<ElasticsearchClientFactory> logger)
    {
        var settings = new ElasticsearchClientSettings(new Uri(options.Value.Url));

        if (!string.IsNullOrEmpty(options.Value.ApiKey))
        {
            settings = settings.Authentication(new ApiKey(options.Value.ApiKey));
        }

        settings = settings.RequestTimeout(TimeSpan.FromSeconds(30));

        _client = new ElasticsearchClient(settings);
        logger.LogInformation("Elasticsearch client created for {Url}", options.Value.Url);
    }

    public ElasticsearchClient GetClient() => _client;
}
