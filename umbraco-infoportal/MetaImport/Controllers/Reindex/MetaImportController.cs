using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Umbraco.Cms.Api.Management.Controllers;
using Umbraco.Cms.Api.Management.Routing;
using Umbraco.Cms.Web.Common.Authorization;
using umbraco_infoportal.MetaImport.Jobs;

namespace umbraco_infoportal.MetaImport.Controllers.MetaImport;

[ApiVersion("1.0")]
[VersionedApiBackOfficeRoute("meta/import")]
[ApiExplorerSettings(GroupName = "MetaImport")]
[Authorize(Policy = AuthorizationPolicies.RequireAdminAccess)]
public class MetaImportController : ManagementApiControllerBase
{
    private readonly MetaImportBackgroundJob _job;
    private readonly ILogger<MetaImportController> _logger;

    public MetaImportController(
        MetaImportBackgroundJob job,
        ILogger<MetaImportController> logger)
    {
        _job = job;
        _logger = logger;
    }

    [HttpPost]
    [MapToApiVersion("1.0")]
    [ProducesResponseType(StatusCodes.Status202Accepted)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    [EndpointSummary("Trigger meta tags import")]
    [EndpointDescription("Imports missing meta tags from json file")]
    public IActionResult Start()
    {
        if (MetaImportBackgroundJob.IsRunning)
        {
            return Conflict(new ProblemDetails
            {
                Title = "Meta import already running",
                Detail = "A meta import job is already in progress. Wait for it to finish before starting another.",
                Status = StatusCodes.Status409Conflict,
                Type = "Error",
            });
        }

        _ = Task.Run(() => _job.ExecuteMetaImportAsync(CancellationToken.None));
        _logger.LogInformation("Manual meta import triggered by {User}", User.Identity?.Name);
        return Accepted();
    }

    [HttpGet("status")]
    [MapToApiVersion("1.0")]
    [ProducesResponseType(typeof(MetaImportStatusResponse), StatusCodes.Status200OK)]
    [EndpointSummary("Get current meta import progress.")]
    public IActionResult Status() => Ok(new MetaImportStatusResponse(
        Status: MetaImportBackgroundJob.Status,
        IsRunning: MetaImportBackgroundJob.IsRunning,
        TotalItems: MetaImportBackgroundJob.TotalItems,
        ProcessedItems: MetaImportBackgroundJob.ProcessedItems,
        PercentComplete: MetaImportBackgroundJob.TotalItems > 0
            ? (int)(100.0 * MetaImportBackgroundJob.ProcessedItems / MetaImportBackgroundJob.TotalItems)
            : 0));

    public record MetaImportStatusResponse(
        string Status,
        bool IsRunning,
        int TotalItems,
        int ProcessedItems,
        int PercentComplete);
}
