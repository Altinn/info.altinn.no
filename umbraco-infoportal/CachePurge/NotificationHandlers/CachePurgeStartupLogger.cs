using Microsoft.Extensions.Options;
using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Notifications;
using Infoportal.Cms.Hosting.Services;

namespace Infoportal.Cms.CachePurge.NotificationHandlers;

// Logs the effective Cloudflare cache purge configuration once at startup, so a missing
// token or zone id is visible in the logs without having to trigger a purge.
public class CachePurgeStartupLogger : INotificationHandler<UmbracoApplicationStartedNotification>
{
    private readonly IOptions<CloudflareOptions> _options;
    private readonly EnvironmentResolver _envResolver;
    private readonly ILogger<CachePurgeStartupLogger> _logger;

    public CachePurgeStartupLogger(
        IOptions<CloudflareOptions> options,
        EnvironmentResolver envResolver,
        ILogger<CachePurgeStartupLogger> logger)
    {
        _options = options;
        _envResolver = envResolver;
        _logger = logger;
    }

    public void Handle(UmbracoApplicationStartedNotification notification)
    {
        CloudflareOptions opts = _options.Value;
        string siteBaseUrl = _envResolver.ResolveForCurrentEnvironment(opts.SiteBaseUrls);
        _logger.LogInformation(
            "Cloudflare cache purge: Enabled={Enabled}, ZoneId={ZoneId}, Env={Env}, SiteBaseUrl={SiteBaseUrl}, ApiTokenConfigured={TokenConfigured}, Threshold={Threshold}",
            opts.Enabled,
            string.IsNullOrEmpty(opts.ZoneId) ? "<empty>" : opts.ZoneId,
            string.IsNullOrEmpty(_envResolver.EnvironmentName) ? "<unset>" : _envResolver.EnvironmentName,
            string.IsNullOrEmpty(siteBaseUrl) ? "<empty>" : siteBaseUrl,
            !string.IsNullOrWhiteSpace(opts.ApiToken),
            opts.AffectedUrlThreshold);
    }
}
