using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Services;
using Infoportal.Cms.Search.Services;

namespace Infoportal.Cms.Search.Jobs;

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
        _status = "starting";
        _processedItems = 0;
        _totalItems = 0;

        _logger.LogInformation("Full reindex started");

        try
        {
            using var scope = _scopeFactory.CreateScope();
            var contentService = scope.ServiceProvider.GetRequiredService<IContentService>();
            var searchService = scope.ServiceProvider.GetRequiredService<ISearchService>();
            var extractor = scope.ServiceProvider.GetRequiredService<ContentTextExtractor>();

            // Build into fresh indices while searches keep using the current ones.
            _status = "creating indices";
            var targetIndices = new Dictionary<string, string>();
            foreach (var culture in Cultures)
            {
                targetIndices[culture] = await searchService.CreateReindexTargetAsync(culture, ct);
            }

            _status = "collecting content";
            var contentIds = CollectAllPublishedContentIds(contentService);
            _totalItems = contentIds.Count;

            _status = "indexing";

            _logger.LogInformation("Reindexing {TotalItems} content items", _totalItems);

            foreach (var contentId in contentIds)
            {
                // Reload right before indexing so edits published since collection
                // (which are also written to the new indices) aren't overwritten.
                var content = contentService.GetById(contentId);
                if (content is { Published: true })
                {
                    foreach (var culture in Cultures)
                    {
                        if (!content.PublishedCultures.Contains(culture))
                            continue;

                        try
                        {
                            var documents = extractor.ExtractDocuments(content, culture);
                            foreach (var document in documents)
                            {
                                await searchService.IndexDocumentIntoAsync(targetIndices[culture], document, ct);
                            }
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex,
                                "Reindex failed for content {ContentId} culture {Culture}",
                                content.Id, culture);
                        }
                    }
                }

                Interlocked.Increment(ref _processedItems);
            }

            _status = "switching indices";
            foreach (var culture in Cultures)
            {
                await searchService.SwapToReindexTargetAsync(culture, ct);
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
            await AbortAsync();
        }
        finally
        {
            Interlocked.Exchange(ref _isRunning, 0);
        }
    }

    // Drops any half-built indices so the current ones stay in use untouched.
    private async Task AbortAsync()
    {
        using var scope = _scopeFactory.CreateScope();
        var searchService = scope.ServiceProvider.GetRequiredService<ISearchService>();
        foreach (var culture in Cultures)
        {
            await searchService.AbortReindexTargetAsync(culture, CancellationToken.None);
        }
    }

    private static List<int> CollectAllPublishedContentIds(IContentService contentService)
    {
        var result = new List<int>();
        var rootContent = contentService.GetRootContent();

        foreach (var root in rootContent)
        {
            CollectRecursive(contentService, root, result);
        }

        return result;
    }

    private static void CollectRecursive(
        IContentService contentService, IContent content, List<int> result)
    {
        if (content.Published)
        {
            result.Add(content.Id);
        }

        var children = contentService.GetPagedChildren(
            content.Id, 0, int.MaxValue, out _,
            propertyAliases: null, filter: null, ordering: null);
        foreach (var child in children)
        {
            CollectRecursive(contentService, child, result);
        }
    }
}
