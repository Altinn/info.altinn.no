using Infoportal.Adapters.Elasticsearch.Services;
using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Notifications;

namespace umbraco_infoportal.Search.Notifications;

public class ContentPublishHandler : INotificationHandler<ContentPublishedNotification>
{
    private readonly ISearchService _searchService;
    private readonly ContentTextExtractor _extractor;
    private readonly ILogger<ContentPublishHandler> _logger;

    public ContentPublishHandler(
        ISearchService searchService,
        ContentTextExtractor extractor,
        ILogger<ContentPublishHandler> logger)
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
                    var document = _extractor.ExtractDocument(content, culture);
                    if (document != null)
                    {
                        _searchService.IndexDocumentAsync(document).GetAwaiter().GetResult();
                        _logger.LogInformation(
                            "Indexed content {ContentId} ({Culture})", content.Id, culture);
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
