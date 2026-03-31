using System.Net;
using Microsoft.AspNetCore.Mvc;
using Umbraco.Cms.Core;
using umbraco_infoportal.Search.Jobs;

namespace umbraco_infoportal.Search.Controllers;

[ApiController]
[Route("api/search/reindex")]
public class ReindexApiController : ControllerBase
{
    private readonly ReindexBackgroundJob _job;
    private readonly ILogger<ReindexApiController> _logger;

    public ReindexApiController(
        ReindexBackgroundJob job,
        ILogger<ReindexApiController> logger)
    {
        _job = job;
        _logger = logger;
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public IActionResult TriggerReindex()
    {
        if (!IsAuthorized())
            return StatusCode(403, new { error = "Forbidden" });

        if (ReindexBackgroundJob.IsRunning)
            return Conflict(new { message = "Reindex already in progress" });

        _ = Task.Run(() => _job.ExecuteReindexAsync(CancellationToken.None));

        _logger.LogInformation("Manual reindex triggered");
        return Accepted(new { message = "Reindex started" });
    }

    [HttpGet("status")]
    public IActionResult GetStatus()
    {
        if (!IsAuthorized())
            return StatusCode(403, new { error = "Forbidden" });

        return Ok(new
        {
            status = ReindexBackgroundJob.Status,
            isRunning = ReindexBackgroundJob.IsRunning,
            totalItems = ReindexBackgroundJob.TotalItems,
            processedItems = ReindexBackgroundJob.ProcessedItems,
            percentComplete = ReindexBackgroundJob.TotalItems > 0
                ? (int)(100.0 * ReindexBackgroundJob.ProcessedItems / ReindexBackgroundJob.TotalItems)
                : 0
        });
    }

    private bool IsAuthorized()
    {
        var remoteIp = HttpContext.Connection.RemoteIpAddress;
        if (remoteIp != null && IPAddress.IsLoopback(remoteIp))
            return true;

        if (HttpContext.User.Identity?.IsAuthenticated != true)
            return false;

        return HttpContext.User.IsInRole(Constants.Security.AdminGroupAlias);
    }
}
