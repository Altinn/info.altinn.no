using Infoportal.Adapters.Cloudflare;
using Microsoft.Extensions.Options;
using umbraco_infoportal.CachePurge.EventHandlers;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.Notifications;

namespace umbraco_infoportal.CachePurge;

public class CachePurgeComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder)
    {
        builder.Services.AddCloudflareAdapter(builder.Config);
        builder.Services.AddSingleton<EnvironmentResolver>();
        builder.Services.AddSingleton<IContentChangeTracker, ContentChangeTracker>();
        builder.Services.AddScoped<ContentUrlResolver>();
        builder.Services.AddScoped<AffectedUrlResolver>();
        builder.Services.AddScoped<CachePurgeDispatcher>();

        builder.AddNotificationHandler<ContentSavedNotification, CachePurgeOnSavedHandler>();
        builder.AddNotificationHandler<ContentPublishedNotification, CachePurgeOnPublishHandler>();
        builder.AddNotificationHandler<ContentUnpublishedNotification, CachePurgeOnUnpublishHandler>();
        builder.AddNotificationHandler<ContentMovedToRecycleBinNotification, CachePurgeOnTrashHandler>();
        builder.AddNotificationHandler<ContentMovedNotification, CachePurgeOnMoveHandler>();
        builder.AddNotificationHandler<ContentSortedNotification, CachePurgeOnSortHandler>();
        builder.AddNotificationHandler<UmbracoApplicationStartedNotification, RuleMapAliasValidator>();

        builder.Services.AddHostedService<CachePurgeStartupLogger>();
    }
}

internal sealed class CachePurgeStartupLogger : IHostedService
{
    private readonly IOptions<CloudflareOptions> _options;
    private readonly EnvironmentResolver _envResolver;
    private readonly ILogger<CachePurgeStartupLogger> _logger;

    public CachePurgeStartupLogger(
        IOptions<CloudflareOptions> options,
        EnvironmentResolver envResolver,
        ILogger<CachePurgeStartupLogger> logger)
    {
        _options = options;
        _envResolver = envResolver;
        _logger = logger;
    }

    public Task StartAsync(CancellationToken cancellationToken)
    {
        CloudflareOptions opts = _options.Value;
        string siteBaseUrl = _envResolver.ResolveForCurrentEnvironment(opts.SiteBaseUrls);
        _logger.LogInformation(
            "Cloudflare cache purge: Enabled={Enabled}, ZoneId={ZoneId}, Env={Env}, SiteBaseUrl={SiteBaseUrl}, ApiTokenConfigured={TokenConfigured}, Threshold={Threshold}",
            opts.Enabled,
            string.IsNullOrEmpty(opts.ZoneId) ? "<empty>" : opts.ZoneId,
            string.IsNullOrEmpty(_envResolver.EnvironmentName) ? "<unset>" : _envResolver.EnvironmentName,
            string.IsNullOrEmpty(siteBaseUrl) ? "<empty>" : siteBaseUrl,
            !string.IsNullOrWhiteSpace(opts.ApiToken),
            opts.AffectedUrlThreshold);
        return Task.CompletedTask;
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
