using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Cms.Core.Services;

namespace umbraco_infoportal.CachePurge.EventHandlers;

public class CachePurgeOnSortHandler : INotificationHandler<ContentSortedNotification>
{
    private readonly IContentService _contentService;
    private readonly CachePurgeDispatcher _dispatcher;
    private readonly ILogger<CachePurgeOnSortHandler> _logger;

    public CachePurgeOnSortHandler(
        IContentService contentService,
        CachePurgeDispatcher dispatcher,
        ILogger<CachePurgeOnSortHandler> logger)
    {
        _contentService = contentService;
        _dispatcher = dispatcher;
        _logger = logger;
    }

    // Sort changes affect the parent listing, not any child's own content — purge the
    // parent only.
    public void Handle(ContentSortedNotification notification)
    {
        IContent? first = notification.SortedEntities.FirstOrDefault();
        if (first == null) return;

        IContent? parent = first.ParentId > 0 ? _contentService.GetById(first.ParentId) : null;
        if (parent == null)
        {
            _logger.LogDebug("Sort handler: parent {ParentId} not found or sort at root — nothing to purge.", first.ParentId);
            return;
        }

        _dispatcher.Dispatch([parent], CachePurgeReason.Sort);
    }
}
