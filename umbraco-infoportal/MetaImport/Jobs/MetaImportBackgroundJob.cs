using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Services;
using System.Text.Json;

namespace umbraco_infoportal.MetaImport.Jobs;

public class MetaImportBackgroundJob : IHostedService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<MetaImportBackgroundJob> _logger;

    private static int _isRunning;
    private static int _totalItems;
    private static int _processedItems;
    private static string _status = "idle";

    public static bool IsRunning => _isRunning == 1;
    public static string Status => _status;
    public static int TotalItems => _totalItems;
    public static int ProcessedItems => _processedItems;

    public MetaImportBackgroundJob(
        IServiceScopeFactory scopeFactory,
        ILogger<MetaImportBackgroundJob> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public Task StartAsync(CancellationToken ct) => Task.CompletedTask;
    public Task StopAsync(CancellationToken ct) => Task.CompletedTask;

    public async Task ExecuteMetaImportAsync(CancellationToken ct)
    {
        if (Interlocked.CompareExchange(ref _isRunning, 1, 0) != 0)
            return;
        _status = "starting";
        _processedItems = 0;
        _totalItems = 157;

        _logger.LogInformation("Page unpublishing started");

        try
        {
            using var scope = _scopeFactory.CreateScope();
            var contentService = scope.ServiceProvider.GetRequiredService<IContentService>();

            string json = System.IO.File.ReadAllText("unpublish.json");
            using JsonDocument doc = JsonDocument.Parse(json);

            foreach (JsonElement item in doc.RootElement.EnumerateArray())
            {
                Guid guid = item.GetProperty("uniqueid").GetGuid();

                _status = "Unpublishing guid " + guid;

                IContent? content = contentService.GetById(guid);

                if (content is null)
                {
                    _logger.LogInformation($"Could not find content {guid}");
                    continue;
                }

                _status = "Unpublishing " + content.Name;

                contentService.Unpublish(content);

                // Update and republish
                Interlocked.Increment(ref _processedItems);
            }   

            _status = "completed";
            _logger.LogInformation(
                "Page unpublishing completed. {Processed}/{Total} items processed",
                _processedItems, _totalItems);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Meta import job failed");
            _status = $"failed: {ex.Message}";
        }
        finally
        {
            Interlocked.Exchange(ref _isRunning, 0);
        }
    }

}
