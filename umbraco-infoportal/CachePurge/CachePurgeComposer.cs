using Microsoft.Extensions.Options;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.Notifications;
using Infoportal.Cms.CachePurge.NotificationHandlers;
using Infoportal.Cms.CachePurge.Services;

namespace Infoportal.Cms.CachePurge;

public class CachePurgeComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder)
    {
        builder.Services.Configure<CloudflareOptions>(builder.Config.GetSection("Cloudflare"));
        builder.Services
            .AddHttpClient<ICloudflareCachePurgeService, CloudflareCachePurgeService>((sp, http) =>
            {
                CloudflareOptions opts = sp.GetRequiredService<IOptions<CloudflareOptions>>().Value;
                http.BaseAddress = new Uri($"https://{opts.ApiHost}/");
                http.Timeout = TimeSpan.FromSeconds(opts.TimeoutSeconds);
            })
            .AddStandardResilienceHandler();

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
        builder.AddNotificationHandler<UmbracoApplicationStartedNotification, CachePurgeStartupLogger>();
    }
}
