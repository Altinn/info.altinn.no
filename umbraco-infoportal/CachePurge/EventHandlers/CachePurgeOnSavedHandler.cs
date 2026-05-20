using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Notifications;

namespace umbraco_infoportal.CachePurge.EventHandlers;

// Detects renames at Saved time: CultureInfos holds the new name while PublishCultureInfos
// still holds the previous published name (no DB query). By ContentPublishingNotification
// Umbraco has already mirrored the two, so the comparison only works here. Result goes to
// IContentChangeTracker for the post-publish resolver.
public class CachePurgeOnSavedHandler : INotificationHandler<ContentSavedNotification>
{
    private readonly IContentChangeTracker _tracker;
    private readonly ILogger<CachePurgeOnSavedHandler> _logger;

    public CachePurgeOnSavedHandler(
        IContentChangeTracker tracker,
        ILogger<CachePurgeOnSavedHandler> logger)
    {
        _tracker = tracker;
        _logger = logger;
    }

    public void Handle(ContentSavedNotification notification)
    {
        foreach (IContent content in notification.SavedEntities)
        {
            if (NameChanged(content))
            {
                _tracker.MarkNameChanged(content.Id);
                _logger.LogDebug(
                    "Name change captured at Saved for content {ContentId} ({Alias})",
                    content.Id, content.ContentType.Alias);
            }
        }
    }

    private static bool NameChanged(IContent content)
    {
        if (content.ContentType.VariesByCulture())
        {
            if (content.CultureInfos is null) return false;
            foreach (ContentCultureInfos ci in content.CultureInfos)
            {
                string? publishedName = GetPublishedName(content, ci.Culture);
                if (!string.Equals(publishedName, ci.Name, StringComparison.Ordinal))
                {
                    return true;
                }
            }
            return false;
        }

        return !string.Equals(content.PublishName, content.Name, StringComparison.Ordinal);
    }

    private static string? GetPublishedName(IContent content, string culture)
    {
        foreach (ContentCultureInfos pub in content.PublishCultureInfos)
        {
            if (string.Equals(pub.Culture, culture, StringComparison.OrdinalIgnoreCase))
                return pub.Name;
        }
        return null;
    }
}
