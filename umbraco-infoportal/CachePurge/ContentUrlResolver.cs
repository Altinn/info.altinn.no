using Infoportal.Adapters.Cloudflare;
using Microsoft.Extensions.Options;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Web;
using Umbraco.Extensions;

namespace umbraco_infoportal.CachePurge;

// Returns ABSOLUTE public URLs (Cloudflare's purge_cache rejects relative paths). Must run
// inside a notification handler — IUmbracoContextFactory isn't background-thread safe.
public class ContentUrlResolver
{
    private readonly IUmbracoContextFactory _umbracoContextFactory;
    private readonly IOptionsMonitor<CloudflareOptions> _options;
    private readonly EnvironmentResolver _envResolver;
    private readonly ILogger<ContentUrlResolver> _logger;

    public ContentUrlResolver(
        IUmbracoContextFactory umbracoContextFactory,
        IOptionsMonitor<CloudflareOptions> options,
        EnvironmentResolver envResolver,
        ILogger<ContentUrlResolver> logger)
    {
        _umbracoContextFactory = umbracoContextFactory;
        _options = options;
        _envResolver = envResolver;
        _logger = logger;
    }

    public string GetSiteBaseUrl() =>
        _envResolver.ResolveForCurrentEnvironment(_options.CurrentValue.SiteBaseUrls);

    public string? GetContentUrl(IContent content, string culture)
    {
        string siteBaseUrl = GetSiteBaseUrl();
        if (string.IsNullOrWhiteSpace(siteBaseUrl)) return null;

        try
        {
            using var ctx = _umbracoContextFactory.EnsureUmbracoContext();
            IPublishedContent? published = ctx.UmbracoContext.Content?.GetById(content.Id);
            if (published == null) return null;

            string relativeUrl = published.Url(culture, UrlMode.Relative);
            if (string.IsNullOrEmpty(relativeUrl) || relativeUrl == "#") return null;

            return CombineUrl(siteBaseUrl, relativeUrl);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to resolve URL for content {ContentId} ({Culture})", content.Id, culture);
            return null;
        }
    }

    public IEnumerable<string> GetUrlsForAllCultures(IContent content)
    {
        // Invariant content has no PublishedCultures — single null-culture pass.
        IEnumerable<string> cultures = content.PublishedCultures.Any()
            ? content.PublishedCultures
            : [string.Empty];

        foreach (string culture in cultures)
        {
            string? url = GetContentUrl(content, culture);
            if (!string.IsNullOrEmpty(url)) yield return url;
        }
    }

    public static string CombineUrl(string siteBaseUrl, string relativeUrl)
    {
        string baseUrl = siteBaseUrl.TrimEnd('/');
        string path = relativeUrl.StartsWith('/') ? relativeUrl : "/" + relativeUrl;
        return baseUrl + path;
    }
}
