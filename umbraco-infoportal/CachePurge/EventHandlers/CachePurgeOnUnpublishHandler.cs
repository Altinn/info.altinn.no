using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Notifications;

namespace umbraco_infoportal.CachePurge.EventHandlers;

public class CachePurgeOnUnpublishHandler : INotificationHandler<ContentUnpublishedNotification>
{
    private readonly CachePurgeDispatcher _dispatcher;

    public CachePurgeOnUnpublishHandler(CachePurgeDispatcher dispatcher)
    {
        _dispatcher = dispatcher;
    }

    public void Handle(ContentUnpublishedNotification notification)
    {
        _dispatcher.Dispatch(notification.UnpublishedEntities, CachePurgeReason.Unpublish);
    }
}
