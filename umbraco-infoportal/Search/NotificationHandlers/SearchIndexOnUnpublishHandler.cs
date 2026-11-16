using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Notifications;
using Infoportal.Cms.Search.Services;

namespace Infoportal.Cms.Search.NotificationHandlers;

public class SearchIndexOnUnpublishHandler : INotificationHandler<ContentUnpublishedNotification>
{
    private readonly ISearchService _searchService;
    private readonly ILogger<SearchIndexOnUnpublishHandler> _logger;

    public SearchIndexOnUnpublishHandler(
        ISearchService searchService,
        ILogger<SearchIndexOnUnpublishHandler> logger)
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
