using Infoportal.Adapters.Elasticsearch.Services;
using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Notifications;

namespace umbraco_infoportal.Search.Notifications;

public class ContentUnpublishHandler : INotificationHandler<ContentUnpublishedNotification>
{
    private readonly ISearchService _searchService;
    private readonly ILogger<ContentUnpublishHandler> _logger;

    public ContentUnpublishHandler(
        ISearchService searchService,
        ILogger<ContentUnpublishHandler> logger)
    {
        _searchService = searchService;
        _logger = logger;
    }

    public void Handle(ContentUnpublishedNotification notification)
    {
        foreach (var content in notification.UnpublishedEntities)
        {
            try
            {
                _searchService.DeleteDocumentAllCulturesAsync(content.Id)
                    .GetAwaiter().GetResult();
                _logger.LogInformation("Removed content {ContentId} from search index", content.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Failed to remove content {ContentId} from search index", content.Id);
            }
        }
    }
}
