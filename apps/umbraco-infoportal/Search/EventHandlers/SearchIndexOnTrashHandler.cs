using Infoportal.Adapters.Elasticsearch.Services;
using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Notifications;

namespace umbraco_infoportal.Search.EventHandlers;

public class SearchIndexOnTrashHandler : INotificationHandler<ContentMovedToRecycleBinNotification>
{
    private readonly ISearchService _searchService;
    private readonly ILogger<SearchIndexOnTrashHandler> _logger;

    public SearchIndexOnTrashHandler(
        ISearchService searchService,
        ILogger<SearchIndexOnTrashHandler> logger)
    {
        _searchService = searchService;
        _logger = logger;
    }

    public void Handle(ContentMovedToRecycleBinNotification notification)
    {
        foreach (var moveInfo in notification.MoveInfoCollection)
        {
            try
            {
                _searchService.DeleteDocumentAllCulturesAsync(moveInfo.Entity.Id)
                    .GetAwaiter().GetResult();
                _logger.LogInformation(
                    "Removed trashed content {ContentId} from search index",
                    moveInfo.Entity.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Failed to remove trashed content {ContentId} from search index",
                    moveInfo.Entity.Id);
            }
        }
    }
}
