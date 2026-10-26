using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using umbraco_infoportal.FormChanges.Models;
using umbraco_infoportal.FormChanges.Services;
using Umbraco.Cms.Api.Management.Controllers;
using Umbraco.Cms.Api.Management.Routing;
using Umbraco.Cms.Web.Common.Authorization;

namespace umbraco_infoportal.FormChanges.Controllers;

[ApiVersion("1.0")]
[VersionedApiBackOfficeRoute("form-changes")]
[ApiExplorerSettings(GroupName = "Form Changes")]
[Authorize(Policy = AuthorizationPolicies.SectionAccessContent)]
public class FormChangesController : ManagementApiControllerBase
{
    private readonly FormChangesReportService _reportService;

    public FormChangesController(FormChangesReportService reportService)
    {
        _reportService = reportService;
    }

    [HttpGet("report")]
    [MapToApiVersion("1.0")]
    [ProducesResponseType(typeof(FormChangesReport), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [EndpointSummary("New, changed, unpublished and discarded form pages in a date range.")]
    public IActionResult Report([FromQuery] FormChangesFilters filters)
    {
        (DateOnly from, DateOnly to) = FormChangesReportService.ResolveRange(filters);
        if (from > to)
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Invalid date range",
                Detail = "The from date must be on or before the to date.",
                Status = StatusCodes.Status400BadRequest,
            });
        }

        return Ok(_reportService.BuildReport(from, to));
    }
}
