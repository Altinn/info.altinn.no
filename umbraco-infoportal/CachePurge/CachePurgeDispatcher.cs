using Infoportal.Adapters.Cloudflare;
using Infoportal.Adapters.Cloudflare.Services;
using Microsoft.Extensions.Options;
using Umbraco.Cms.Core.Models;
using umbraco_infoportal.Search;

namespace umbraco_infoportal.CachePurge;

public enum CachePurgeReason
{
    Publish,
    Unpublish,
    Trash,
    Move,
    Sort,
}

public class CachePurgeDispatcher
{
    private static readonly string[] SearchPaths = ["/sok/", "/nn/sok/", "/en/search/"];

    private readonly AffectedUrlResolver _resolver;
    private readonly EnvironmentResolver _envResolver;
    private readonly IOptionsMonitor<CloudflareOptions> _options;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<CachePurgeDispatcher> _logger;

    public CachePurgeDispatcher(
        AffectedUrlResolver resolver,
        EnvironmentResolver envResolver,
        IOptionsMonitor<CloudflareOptions> options,
        IServiceScopeFactory scopeFactory,
        ILogger<CachePurgeDispatcher> logger)
    {
        _resolver = resolver;
        _envResolver = envResolver;
        _options = options;
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public void Dispatch(IEnumerable<IContent> entities, CachePurgeReason reason)
    {
        HashSet<string> urls = new(StringComparer.Ordinal);
        bool forcePurgeEverything = false;
        bool anyIndexable = false;
        List<int> contentIds = [];

        foreach (IContent content in entities)
        {
            contentIds.Add(content.Id);
            if (ContentTextExtractor.IsIndexable(content.ContentType.Alias)) anyIndexable = true;
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

        string[] searchPrefixes =
            anyIndexable && reason is CachePurgeReason.Publish or CachePurgeReason.Unpublish or CachePurgeReason.Trash
                ? BuildSearchPrefixes()
                : [];

        if (urls.Count == 0 && !forcePurgeEverything && searchPrefixes.Length == 0) return;

        SchedulePurge(urls.ToArray(), forcePurgeEverything, searchPrefixes, contentIds.ToArray(), reason);
    }

    public void DispatchPurgeEverything(CachePurgeReason reason)
    {
        SchedulePurge([], forcePurgeEverything: true, searchPrefixes: [], contentIds: [], reason);
    }

    private string[] BuildSearchPrefixes()
    {
        string siteBaseUrl = _envResolver.ResolveForCurrentEnvironment(_options.CurrentValue.SiteBaseUrls);
        if (string.IsNullOrWhiteSpace(siteBaseUrl) || !Uri.TryCreate(siteBaseUrl, UriKind.Absolute, out Uri? uri))
            return [];

        // Host + path, no scheme — Cloudflare prefix format. Matches the per-env host the
        // URL purge already targets, so only the configured env host is purged.
        return SearchPaths.Select(p => $"{uri.Authority}{p}").ToArray();
    }

    private void SchedulePurge(string[] urls, bool forcePurgeEverything, string[] searchPrefixes, int[] contentIds, CachePurgeReason reason)
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
                    if (urls.Length > 0)
                    {
                        logger.LogInformation("Cache purge ({Reason}): purging {Count} URLs", reason, urls.Length);
                        await purge.PurgeUrlsAsync(urls);
                    }
                    if (searchPrefixes.Length > 0)
                    {
                        logger.LogInformation("Cache purge ({Reason}): purging {Count} search prefixes", reason, searchPrefixes.Length);
                        await purge.PurgePrefixesAsync(searchPrefixes);
                    }
                }
            }
            catch (Exception ex)
            {
                // SECURITY: log content IDs only, not URLs — they'd land in Loki and could leak draft slugs / future unlisted paths.
                logger.LogError(ex,
                    "Cloudflare cache purge failed ({Reason}): {Count} URLs, contentIds=[{Ids}]",
                    reason, urls.Length, string.Join(",", contentIds));
            }
        });
    }
}
