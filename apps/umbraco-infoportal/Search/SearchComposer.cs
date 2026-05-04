using Infoportal.Adapters.Elasticsearch;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.Notifications;
using umbraco_infoportal.Search.EventHandlers;
using umbraco_infoportal.Search.Jobs;

namespace umbraco_infoportal.Search;

public class SearchComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder)
    {
        builder.Services.AddElasticsearchAdapter(builder.Config);
        builder.Services.AddScoped<ContentTextExtractor>();
        builder.Services.AddSingleton<ReindexBackgroundJob>();
        builder.Services.AddHostedService(sp => sp.GetRequiredService<ReindexBackgroundJob>());

        builder.AddNotificationHandler<ContentPublishedNotification, SearchIndexOnPublishHandler>();
        builder.AddNotificationHandler<ContentUnpublishedNotification, SearchIndexOnUnpublishHandler>();
        builder.AddNotificationHandler<ContentMovedToRecycleBinNotification, SearchIndexOnTrashHandler>();
    }
}
