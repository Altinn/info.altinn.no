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

    private static readonly string[] Cultures = ["nb", "nn", "en"];

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
        _totalItems = 1043;

        _logger.LogInformation("Meta tags import started");

        try
        {
            using var scope = _scopeFactory.CreateScope();
            var contentService = scope.ServiceProvider.GetRequiredService<IContentService>();

            foreach (var culture in Cultures)
            {
                _status = "importing for culture " + culture;

                _logger.LogInformation(_status);

                string json = System.IO.File.ReadAllText($"seo-{culture}.json");
                using JsonDocument doc = JsonDocument.Parse(json);

                foreach (JsonElement item in doc.RootElement.EnumerateArray())
                {
                    Guid guid = item.GetProperty("ContentGUID").GetGuid();

                    _status = "importing for guid " + guid;

                    item.TryGetProperty("MetaKeywords", out JsonElement metaKeywords);
                    item.TryGetProperty("MetaDescription", out JsonElement metaDescription);

                    IContent? content = contentService.GetById(guid);

                    if (content is null)
                    {
                        _logger.LogInformation($"Could not find content {guid}");
                        continue;
                    }

                    _status = "importing meta tags for " + content.Name;

                    bool changed = false;
                    
                    string? existingValue = content.GetValue<string>("metaKeywords", culture);

                    Console.WriteLine("Existing value: " + existingValue);

                    if (metaKeywords.ValueKind != JsonValueKind.Null && string.IsNullOrEmpty(content.GetValue<string>("metaKeywords", culture)))
                    {
                        content.SetValue("metaKeywords", metaKeywords, culture);
                        changed = true;
                    }

                    if (metaDescription.ValueKind != JsonValueKind.Null && string.IsNullOrEmpty(content.GetValue<string>("metaDescription", culture)))
                    {
                        content.SetValue("metaDescription", metaDescription, culture);
                        changed = true;
                    }

                    if (changed)
                    {
                        contentService.Save(content);
                        contentService.Publish(content, [culture]);
                    }

                    // Update and republish
                    Interlocked.Increment(ref _processedItems);
                }
            }            

            _status = "completed";
            _logger.LogInformation(
                "Meta import completed. {Processed}/{Total} items processed",
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
