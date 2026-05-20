using Infoportal.Adapters.Cloudflare.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace Infoportal.Adapters.Cloudflare;

public static class ConfigureCloudflareAdapter
{
    public static IServiceCollection AddCloudflareAdapter(
        this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<CloudflareOptions>(configuration.GetSection("Cloudflare"));

        services
            .AddHttpClient<ICloudflareCachePurgeService, CloudflareCachePurgeService>((sp, http) =>
            {
                CloudflareOptions opts = sp.GetRequiredService<IOptions<CloudflareOptions>>().Value;
                http.BaseAddress = new Uri($"https://{opts.ApiHost}/");
                http.Timeout = TimeSpan.FromSeconds(opts.TimeoutSeconds);
            })
            .AddStandardResilienceHandler();

        return services;
    }
}
