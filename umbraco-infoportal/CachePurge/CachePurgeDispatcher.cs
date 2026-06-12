using Infoportal.Adapters.Cloudflare;
using Infoportal.Adapters.Cloudflare.Services;
using Microsoft.Extensions.Options;
using Umbraco.Cms.Core.Models;

namespace umbraco_infoportal.CachePurge;

public enum CachePurgeReason
{
    Publish,
    Unpublish,
    Trash,
    Move,
    Sort,
}

// Fire-and-forget: a purge can take seconds and would otherwise freeze the backoffice
// "Saving…" spinner. If the pod recycles mid-purge it's lost, but s-maxage covers it.
public class CachePurgeDispatcher
{
    private readonly AffectedUrlResolver _resolver;
    private readonly IOptionsMonitor<CloudflareOptions> _options;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<CachePurgeDispatcher> _logger;

    public CachePurgeDispatcher(
        AffectedUrlResolver resolver,
        IOptionsMonitor<CloudflareOptions> options,
        IServiceScopeFactory scopeFactory,
        ILogger<CachePurgeDispatcher> logger)
    {
        _resolver = resolver;
        _options = options;
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public void Dispatch(IEnumerable<IContent> entities, CachePurgeReason reason)
    {
        HashSet<string> urls = new(StringComparer.Ordinal);
        bool forcePurgeEverything = false;
        List<int> contentIds = [];

        foreach (IContent content in entities)
        {
            contentIds.Add(content.Id);
            try
            {
                AffectedUrlSet result = _resolver.Resolve(content, reason);
                foreach (string url in result.Urls) urls.Add(url);
                if (result.ForcePurgeEverything) forcePurgeEverything = true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to resolve URLs for content {ContentId} (reason={Reason})", content.Id, reason);
            }
        }

        if (urls.Count == 0 && !forcePurgeEverything) return;

        SchedulePurge(urls.ToArray(), forcePurgeEverything, contentIds.ToArray(), reason);
    }

    public void DispatchPurgeEverything(CachePurgeReason reason)
    {
        SchedulePurge([], forcePurgeEverything: true, contentIds: [], reason);
    }

    private void SchedulePurge(string[] urls, bool forcePurgeEverything, int[] contentIds, CachePurgeReason reason)
    {
        int threshold = _options.CurrentValue.AffectedUrlThreshold;

        _ = Task.Run(async () =>
        {
            // Fresh scope — the notification-handling scope may be disposed by now.
            using IServiceScope scope = _scopeFactory.CreateScope();
            ICloudflareCachePurgeService purge = scope.ServiceProvider.GetRequiredService<ICloudflareCachePurgeService>();
            ILogger<CachePurgeDispatcher> logger = scope.ServiceProvider.GetRequiredService<ILogger<CachePurgeDispatcher>>();

            try
            {
                if (forcePurgeEverything || urls.Length > threshold)
                {
                    logger.LogWarning(
                        "Cache purge ({Reason}): purge_everything (force={Force}, threshold={Threshold}, {Count} collected URLs discarded)",
                        reason, forcePurgeEverything, threshold, urls.Length);
                    await purge.PurgeEverythingAsync();
                }
                else
                {
                    logger.LogInformation("Cache purge ({Reason}): purging {Count} URLs", reason, urls.Length);
                    await purge.PurgeUrlsAsync(urls);
                }
            }
            catch (Exception ex)
            {
                // SECURITY: log content IDs only, not URLs — they'd land in Loki and could
                // leak draft slugs / future unlisted paths.
                logger.LogError(ex,
                    "Cloudflare cache purge failed ({Reason}): {Count} URLs, contentIds=[{Ids}]",
                    reason, urls.Length, string.Join(",", contentIds));
            }
        });
    }
}
