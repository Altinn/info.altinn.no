using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Notifications;

namespace umbraco_infoportal.CachePurge.EventHandlers;

public class CachePurgeOnMoveHandler : INotificationHandler<ContentMovedNotification>
{
    private readonly CachePurgeDispatcher _dispatcher;

    public CachePurgeOnMoveHandler(CachePurgeDispatcher dispatcher)
    {
        _dispatcher = dispatcher;
    }

    // v1: blanket purge_everything for moves. Reconstructing pre-move URLs across cultures
    // + descendants is non-trivial in Umbraco 17. Targeted move purging is a v1.1 task.
    public void Handle(ContentMovedNotification notification)
    {
        if (!notification.MoveInfoCollection.Any()) return;
        _dispatcher.DispatchPurgeEverything(CachePurgeReason.Move);
    }
}
