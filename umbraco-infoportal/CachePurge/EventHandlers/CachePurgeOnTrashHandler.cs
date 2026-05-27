using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Notifications;

namespace umbraco_infoportal.CachePurge.EventHandlers;

public class CachePurgeOnTrashHandler : INotificationHandler<ContentMovedToRecycleBinNotification>
{
    private readonly CachePurgeDispatcher _dispatcher;

    public CachePurgeOnTrashHandler(CachePurgeDispatcher dispatcher)
    {
        _dispatcher = dispatcher;
    }

    public void Handle(ContentMovedToRecycleBinNotification notification)
    {
        _dispatcher.Dispatch(notification.MoveInfoCollection.Select(m => m.Entity), CachePurgeReason.Trash);
    }
}
