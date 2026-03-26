using Infoportal.Adapters.Elasticsearch;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.Notifications;
using umbraco_infoportal.Search.Jobs;
using umbraco_infoportal.Search.Notifications;

namespace umbraco_infoportal.Search;

public class SearchComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder)
    {
        builder.Services.AddElasticsearchAdapter(builder.Config);
        builder.Services.AddScoped<ContentTextExtractor>();
        builder.Services.AddSingleton<ReindexBackgroundJob>();
        builder.Services.AddHostedService(sp => sp.GetRequiredService<ReindexBackgroundJob>());

        builder.AddNotificationHandler<ContentPublishedNotification, ContentPublishHandler>();
        builder.AddNotificationHandler<ContentUnpublishedNotification, ContentUnpublishHandler>();
        builder.AddNotificationHandler<ContentMovedToRecycleBinNotification, ContentTrashHandler>();
    }
}
