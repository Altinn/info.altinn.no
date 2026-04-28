using Infoportal.Adapters.Elasticsearch.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Infoportal.Adapters.Elasticsearch;

public static class ConfigureElasticsearchAdapter
{
    public static IServiceCollection AddElasticsearchAdapter(
        this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<ElasticsearchOptions>(
            configuration.GetSection("Elasticsearch"));
        services.AddSingleton<ElasticsearchClientFactory>();
        services.AddScoped<ISearchService, ElasticsearchSearchService>();
        return services;
    }
}
