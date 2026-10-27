using Infoportal.RichText;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Services;

namespace umbraco_infoportal.LegacyLinks.Jobs;

/// <summary>
/// One-off job (#710) that replaces legacy "~/link/{guid}.aspx" links from the old CMS
/// with Umbraco local links in all published pages, and republishes the changed pages.
/// Pages with unpublished changes are skipped so editors' drafts aren't published.
/// </summary>
public class LegacyLinkBackgroundJob : IHostedService
{
    // Pause between republished pages to keep load low for editors and visitors.
    private static readonly TimeSpan PublishDelay = TimeSpan.FromMilliseconds(250);
    private const int MaxLogEntries = 1000;

    // Pages that no longer exist and were redirected in #699 (see resolveAspxRedirect in
    // astro-infoportal/src/pages/[...slug].astro). Maps old key to the nb route of the new page.
    private static readonly Dictionary<Guid, string> RedirectedPages = new()
    {
        [Guid.Parse("B9DCB0CA-2342-40B7-848E-09831F3BBC26")] = "/hjelp/ny-tilgangsstyring/",
        [Guid.Parse("89EE8D8A-F3DB-4B2D-B7EC-11E33C78714F")] = "/hjelp/ny-innboks-beta/",
        [Guid.Parse("D3A1D3C5-B102-43C8-8522-3D99D27B7BAD")] = "/hjelp/systemtilgang/",
        [Guid.Parse("CFD06368-21FD-4FA0-8621-6A9665640A0F")] = "/hjelp/innlogging/",
        [Guid.Parse("2CE1A67C-2C6C-40BA-929D-84F8A3013426")] = "/hjelp/innlogging/",
        [Guid.Parse("6EB9787F-B889-4452-A505-B05EF9ACC8D9")] = "/hjelp/",
        [Guid.Parse("79519E28-7698-411C-A554-C361003866CE")] = "/hjelp/ny-tilgangsstyring/",
        [Guid.Parse("5B1E2E22-38DD-4D3F-82F7-CB11996949F9")] = "/hjelp/innlogging/slik-logger-du-inn-i-altinn/",
    };

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<LegacyLinkBackgroundJob> _logger;

    private static int _isRunning;
    private static int _totalItems;
    private static int _processedItems;
    private static int _changedPages;
    private static int _replacedLinks;
    private static int _unresolvedLinks;
    private static int _skippedPages;
    private static bool _dryRun;
    private static string _status = "idle";
    private static readonly List<string> _log = [];

    public static bool IsRunning => _isRunning == 1;
    public static string Status => _status;
    public static int TotalItems => _totalItems;
    public static int ProcessedItems => _processedItems;
    public static int ChangedPages => _changedPages;
    public static int ReplacedLinks => _replacedLinks;
    public static int UnresolvedLinks => _unresolvedLinks;
    public static int SkippedPages => _skippedPages;
    public static bool DryRun => _dryRun;

    public static IReadOnlyList<string> Log
    {
        get
        {
            lock (_log)
            {
                return _log.ToList();
            }
        }
    }

    public LegacyLinkBackgroundJob(
        IServiceScopeFactory scopeFactory,
        ILogger<LegacyLinkBackgroundJob> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public Task StartAsync(CancellationToken ct) => Task.CompletedTask;
    public Task StopAsync(CancellationToken ct) => Task.CompletedTask;

    public async Task ExecuteAsync(bool dryRun, CancellationToken ct)
    {
        if (Interlocked.CompareExchange(ref _isRunning, 1, 0) != 0)
            return;
        _status = "starting";
        _dryRun = dryRun;
        _totalItems = 0;
        _processedItems = 0;
        _changedPages = 0;
        _replacedLinks = 0;
        _unresolvedLinks = 0;
        _skippedPages = 0;
        lock (_log)
        {
            _log.Clear();
        }

        _logger.LogInformation("Legacy link replacement started (dry run: {DryRun})", dryRun);

        try
        {
            using var scope = _scopeFactory.CreateScope();
            var contentService = scope.ServiceProvider.GetRequiredService<IContentService>();
            var mediaService = scope.ServiceProvider.GetRequiredService<IMediaService>();
            var documentUrlService = scope.ServiceProvider.GetRequiredService<IDocumentUrlService>();

            _status = "resolving redirected pages";
            var redirectTargets = ResolveRedirectTargets(contentService, documentUrlService);
            var resolver = new TargetResolver(contentService, mediaService, redirectTargets);

            _status = "collecting content";
            var contentIds = CollectAllContentIds(contentService);
            _totalItems = contentIds.Count;

            _status = dryRun ? "checking pages (dry run)" : "replacing links";

            foreach (var contentId in contentIds)
            {
                ct.ThrowIfCancellationRequested();

                // Reload right before processing to pick up edits made since collection.
                var content = contentService.GetById(contentId);
                if (content is { Published: true, Trashed: false }
                    && ProcessContent(contentService, content, resolver.Resolve, dryRun))
                {
                    await Task.Delay(PublishDelay, ct);
                }

                Interlocked.Increment(ref _processedItems);
            }

            _status = "completed";
            _logger.LogInformation(
                "Legacy link replacement completed (dry run: {DryRun}). Pages: {Processed}, changed: {Changed}, skipped: {Skipped}, links replaced: {Replaced}, unresolved: {Unresolved}",
                dryRun, _processedItems, _changedPages, _skippedPages, _replacedLinks, _unresolvedLinks);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Legacy link replacement job failed");
            _status = $"failed: {ex.Message}";
        }
        finally
        {
            Interlocked.Exchange(ref _isRunning, 0);
        }
    }

    // Returns true if the page was (or in a dry run, would have been) republished.
    private bool ProcessContent(IContentService contentService, IContent content, Func<Guid, LegacyLinkTarget?> resolve, bool dryRun)
    {
        var changes = new List<LegacyLinkChange>();
        var newValues = new List<(string Alias, string? Culture, string? Segment, string Value)>();

        foreach (var property in content.Properties)
        {
            foreach (var propertyValue in property.Values)
            {
                if (propertyValue.EditedValue is not string value || !LegacyLinkRewriter.ContainsLegacyLink(value))
                    continue;

                string rewritten = LegacyLinkRewriter.Rewrite(value, resolve, changes);
                if (rewritten != value)
                {
                    newValues.Add((property.Alias, propertyValue.Culture, propertyValue.Segment, rewritten));
                }
            }
        }

        foreach (var change in changes)
        {
            if (change.NewKey is null)
            {
                Interlocked.Increment(ref _unresolvedLinks);
                AddLog($"UNRESOLVED \"{content.Name}\" ({content.Key}): {change.OldHref}");
            }
        }

        if (newValues.Count == 0)
            return false;

        // Saving and publishing would also publish the editor's pending draft.
        if (content.Edited)
        {
            Interlocked.Increment(ref _skippedPages);
            AddLog($"SKIPPED \"{content.Name}\" ({content.Key}): has unpublished changes");
            return false;
        }

        foreach (var change in changes.Where(c => c.NewKey is not null))
        {
            Interlocked.Increment(ref _replacedLinks);
            AddLog($"{(dryRun ? "WOULD REPLACE" : "REPLACED")} \"{content.Name}\" ({content.Key}): {change.OldHref} -> {change.NewHref}");
        }

        Interlocked.Increment(ref _changedPages);

        if (dryRun)
            return false;

        foreach (var (alias, culture, segment, value) in newValues)
        {
            content.SetValue(alias, value, culture, segment);
        }

        var cultures = content.ContentType.VariesByCulture()
            ? content.PublishedCultures.ToArray()
            : ["*"];

        contentService.Save(content);
        var result = contentService.Publish(content, cultures);

        if (!result.Success)
        {
            AddLog($"PUBLISH FAILED \"{content.Name}\" ({content.Key}): {result.Result}");
        }

        return true;
    }

    private void AddLog(string message)
    {
        _logger.LogInformation("Legacy links: {Message}", message);
        lock (_log)
        {
            if (_log.Count < MaxLogEntries)
            {
                _log.Add(message);
            }
        }
    }

    private Dictionary<Guid, Guid> ResolveRedirectTargets(IContentService contentService, IDocumentUrlService documentUrlService)
    {
        var result = new Dictionary<Guid, Guid>();
        var rootIds = contentService.GetRootContent().Select(c => (int?)c.Id).Append(null).ToList();

        foreach (var (oldKey, path) in RedirectedPages)
        {
            string route = path.TrimEnd('/');
            Guid? newKey = rootIds
                .Select(rootId => documentUrlService.GetDocumentKeyByRoute(route.Length == 0 ? "/" : route, "nb", rootId, false))
                .FirstOrDefault(key => key is not null);

            if (newKey is null)
            {
                AddLog($"REDIRECT NOT FOUND {oldKey:N}: {path}");
                continue;
            }

            result[oldKey] = newKey.Value;
        }

        return result;
    }

    private static List<int> CollectAllContentIds(IContentService contentService)
    {
        const int pageSize = 200;
        var result = new List<int>();
        long pageIndex = 0;
        long total;

        do
        {
            var page = contentService.GetPagedDescendants(
                Constants.System.Root, pageIndex++, pageSize, out total, null, null);
            result.AddRange(page.Select(c => c.Id));
        }
        while (pageIndex * pageSize < total);

        return result;
    }

    private sealed class TargetResolver(
        IContentService contentService,
        IMediaService mediaService,
        Dictionary<Guid, Guid> redirectTargets)
    {
        private readonly Dictionary<Guid, LegacyLinkTarget?> _cache = [];

        public LegacyLinkTarget? Resolve(Guid oldKey)
        {
            if (!_cache.TryGetValue(oldKey, out var target))
            {
                target = Lookup(oldKey);
                _cache[oldKey] = target;
            }

            return target;
        }

        private LegacyLinkTarget? Lookup(Guid oldKey)
        {
            var content = contentService.GetById(oldKey);

            if (content is { Published: true, Trashed: false })
                return new LegacyLinkTarget(oldKey, LegacyLinkTargetType.Document);

            if (redirectTargets.TryGetValue(oldKey, out var newKey))
                return new LegacyLinkTarget(newKey, LegacyLinkTargetType.Document);

            // Unpublished pages keep their key, so editors see the reference when republishing.
            if (content is { Trashed: false })
                return new LegacyLinkTarget(oldKey, LegacyLinkTargetType.Document);

            if (mediaService.GetById(oldKey) is { Trashed: false })
                return new LegacyLinkTarget(oldKey, LegacyLinkTargetType.Media);

            return null;
        }
    }
}
