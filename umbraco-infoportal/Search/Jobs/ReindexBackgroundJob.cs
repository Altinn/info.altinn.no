using Infoportal.Adapters.Elasticsearch.Services;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Services;

namespace umbraco_infoportal.Search.Jobs;

public class ReindexBackgroundJob : IHostedService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<ReindexBackgroundJob> _logger;

    private static int _isRunning;
    private static int _totalItems;
    private static int _processedItems;
    private static string _status = "idle";

    private static readonly string[] Cultures = ["nb", "nn", "en"];

    public static bool IsRunning => _isRunning == 1;
    public static string Status => _status;
    public static int TotalItems => _totalItems;
    public static int ProcessedItems => _processedItems;

    public ReindexBackgroundJob(
        IServiceScopeFactory scopeFactory,
        ILogger<ReindexBackgroundJob> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public Task StartAsync(CancellationToken ct) => Task.CompletedTask;
    public Task StopAsync(CancellationToken ct) => Task.CompletedTask;

    public async Task ExecuteReindexAsync(CancellationToken ct)
    {
        if (Interlocked.CompareExchange(ref _isRunning, 1, 0) != 0)
            return;
        _status = "running";
        _processedItems = 0;
        _totalItems = 0;

        _logger.LogInformation("Full reindex started");

        try
        {
            using var scope = _scopeFactory.CreateScope();
            var contentService = scope.ServiceProvider.GetRequiredService<IContentService>();
            var searchService = scope.ServiceProvider.GetRequiredService<ISearchService>();
            var extractor = scope.ServiceProvider.GetRequiredService<ContentTextExtractor>();

            foreach (var culture in Cultures)
            {
                await searchService.DeleteIndexAsync(culture, ct);
                await searchService.EnsureIndexExistsAsync(culture, ct);
            }

            var allContent = CollectAllPublishedContent(contentService);
            _totalItems = allContent.Count;

            _logger.LogInformation("Reindexing {TotalItems} content items", _totalItems);

            foreach (var content in allContent)
            {
                foreach (var culture in Cultures)
                {
                    if (!content.PublishedCultures.Contains(culture))
                        continue;

                    try
                    {
                        var document = extractor.ExtractDocument(content, culture);
                        if (document != null)
                        {
                            await searchService.IndexDocumentAsync(document, ct);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex,
                            "Reindex failed for content {ContentId} culture {Culture}",
                            content.Id, culture);
                    }
                }

                Interlocked.Increment(ref _processedItems);
            }

            _status = "completed";
            _logger.LogInformation(
                "Full reindex completed. {Processed}/{Total} items processed",
                _processedItems, _totalItems);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Full reindex job failed");
            _status = $"failed: {ex.Message}";
        }
        finally
        {
            Interlocked.Exchange(ref _isRunning, 0);
        }
    }

    private static List<IContent> CollectAllPublishedContent(IContentService contentService)
    {
        var result = new List<IContent>();
        var rootContent = contentService.GetRootContent();

        foreach (var root in rootContent)
        {
            CollectRecursive(contentService, root, result);
        }

        return result;
    }

    private static void CollectRecursive(
        IContentService contentService, IContent content, List<IContent> result)
    {
        if (content.Published)
        {
            result.Add(content);
        }

        var children = contentService.GetPagedChildren(content.Id, 0, int.MaxValue, out _);
        foreach (var child in children)
        {
            CollectRecursive(contentService, child, result);
        }
    }
}
