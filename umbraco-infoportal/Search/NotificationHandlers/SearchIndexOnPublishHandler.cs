using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Notifications;
using Infoportal.Cms.Search.Services;

namespace Infoportal.Cms.Search.NotificationHandlers;

public class SearchIndexOnPublishHandler : INotificationHandler<ContentPublishedNotification>
{
    private readonly ISearchService _searchService;
    private readonly ContentTextExtractor _extractor;
    private readonly ILogger<SearchIndexOnPublishHandler> _logger;

    public SearchIndexOnPublishHandler(
        ISearchService searchService,
        ContentTextExtractor extractor,
        ILogger<SearchIndexOnPublishHandler> logger)
    {
        _searchService = searchService;
        _extractor = extractor;
        _logger = logger;
    }

    public void Handle(ContentPublishedNotification notification)
    {
        foreach (var content in notification.PublishedEntities)
        {
            foreach (var culture in content.PublishedCultures)
            {
                try
                {
                    var documents = _extractor.ExtractDocuments(content, culture);
                    foreach (var document in documents)
                    {
                        _searchService.IndexDocumentAsync(document).GetAwaiter().GetResult();
                        _logger.LogInformation(
                            "Indexed content {ContentId} ({Culture})", content.Id, culture);
                    }

                    if (ContentTextExtractor.IsIndexable(content.ContentType.Alias))
                    {
                        _searchService.DeleteStaleDocumentsAsync(
                                content.Id, culture, documents.Select(d => d.Id).ToList())
                            .GetAwaiter().GetResult();
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex,
                        "Failed to index content {ContentId} for culture {Culture}",
                        content.Id, culture);
                }
            }
        }
    }
}
