using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Notifications;
using Infoportal.Cms.CachePurge.Services;

namespace Infoportal.Cms.CachePurge.NotificationHandlers;

public class CachePurgeOnPublishHandler : INotificationHandler<ContentPublishedNotification>
{
    private readonly CachePurgeDispatcher _dispatcher;

    public CachePurgeOnPublishHandler(CachePurgeDispatcher dispatcher)
    {
        _dispatcher = dispatcher;
    }

    public void Handle(ContentPublishedNotification notification)
    {
        _dispatcher.Dispatch(notification.PublishedEntities, CachePurgeReason.Publish);
    }
}
