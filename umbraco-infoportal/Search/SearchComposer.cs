using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.Notifications;
using Infoportal.Cms.Search.Jobs;
using Infoportal.Cms.Search.NotificationHandlers;
using Infoportal.Cms.Search.Services;

namespace Infoportal.Cms.Search;

public class SearchComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder)
    {
        builder.Services.Configure<ElasticsearchOptions>(builder.Config.GetSection("Elasticsearch"));
        builder.Services.AddSingleton<ElasticsearchClientFactory>();
        builder.Services.AddScoped<ISearchService, ElasticsearchSearchService>();
        builder.Services.AddScoped<ContentTextExtractor>();
        builder.Services.AddSingleton<ReindexBackgroundJob>();
        builder.Services.AddHostedService(sp => sp.GetRequiredService<ReindexBackgroundJob>());

        builder.AddNotificationHandler<ContentPublishedNotification, SearchIndexOnPublishHandler>();
        builder.AddNotificationHandler<ContentUnpublishedNotification, SearchIndexOnUnpublishHandler>();
        builder.AddNotificationHandler<ContentMovedToRecycleBinNotification, SearchIndexOnTrashHandler>();
    }
}
