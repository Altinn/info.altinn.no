using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Umbraco.Cms.Api.Management.Controllers;
using Umbraco.Cms.Api.Management.Routing;
using Umbraco.Cms.Web.Common.Authorization;
using umbraco_infoportal.LegacyLinks.Jobs;

namespace umbraco_infoportal.LegacyLinks.Controllers;

[ApiVersion("1.0")]
[VersionedApiBackOfficeRoute("legacy-links")]
[ApiExplorerSettings(GroupName = "LegacyLinks")]
[Authorize(Policy = AuthorizationPolicies.RequireAdminAccess)]
public class LegacyLinkController : ManagementApiControllerBase
{
    private readonly LegacyLinkBackgroundJob _job;
    private readonly ILogger<LegacyLinkController> _logger;

    public LegacyLinkController(
        LegacyLinkBackgroundJob job,
        ILogger<LegacyLinkController> logger)
    {
        _job = job;
        _logger = logger;
    }

    [HttpPost]
    [MapToApiVersion("1.0")]
    [ProducesResponseType(StatusCodes.Status202Accepted)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    [EndpointSummary("Replace legacy .aspx links")]
    [EndpointDescription("Replaces ~/link/{guid}.aspx links in all published pages with Umbraco local links and republishes the changed pages. With dryRun=true nothing is saved.")]
    public IActionResult Start([FromQuery] bool dryRun = false)
    {
        if (LegacyLinkBackgroundJob.IsRunning)
        {
            return Conflict(new ProblemDetails
            {
                Title = "Legacy link replacement already running",
                Detail = "A legacy link replacement job is already in progress. Wait for it to finish before starting another.",
                Status = StatusCodes.Status409Conflict,
                Type = "Error",
            });
        }

        _ = Task.Run(() => _job.ExecuteAsync(dryRun, CancellationToken.None));
        _logger.LogInformation("Legacy link replacement (dry run: {DryRun}) triggered by {User}", dryRun, User.Identity?.Name);
        return Accepted();
    }

    [HttpGet("status")]
    [MapToApiVersion("1.0")]
    [ProducesResponseType(typeof(LegacyLinkStatusResponse), StatusCodes.Status200OK)]
    [EndpointSummary("Get current legacy link replacement progress.")]
    public IActionResult Status() => Ok(new LegacyLinkStatusResponse(
        Status: LegacyLinkBackgroundJob.Status,
        IsRunning: LegacyLinkBackgroundJob.IsRunning,
        DryRun: LegacyLinkBackgroundJob.DryRun,
        TotalItems: LegacyLinkBackgroundJob.TotalItems,
        ProcessedItems: LegacyLinkBackgroundJob.ProcessedItems,
        PercentComplete: LegacyLinkBackgroundJob.TotalItems > 0
            ? (int)(100.0 * LegacyLinkBackgroundJob.ProcessedItems / LegacyLinkBackgroundJob.TotalItems)
            : 0,
        ChangedPages: LegacyLinkBackgroundJob.ChangedPages,
        SkippedPages: LegacyLinkBackgroundJob.SkippedPages,
        ReplacedLinks: LegacyLinkBackgroundJob.ReplacedLinks,
        UnresolvedLinks: LegacyLinkBackgroundJob.UnresolvedLinks,
        Log: LegacyLinkBackgroundJob.Log));

    public record LegacyLinkStatusResponse(
        string Status,
        bool IsRunning,
        bool DryRun,
        int TotalItems,
        int ProcessedItems,
        int PercentComplete,
        int ChangedPages,
        int SkippedPages,
        int ReplacedLinks,
        int UnresolvedLinks,
        IReadOnlyList<string> Log);
}
