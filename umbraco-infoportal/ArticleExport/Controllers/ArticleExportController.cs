using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using umbraco_infoportal.ArticleExport.Models;
using umbraco_infoportal.ArticleExport.Services;
using Umbraco.Cms.Api.Management.Controllers;
using Umbraco.Cms.Api.Management.Routing;
using Umbraco.Cms.Web.Common.Authorization;

namespace umbraco_infoportal.ArticleExport.Controllers;

[ApiVersion("1.0")]
[VersionedApiBackOfficeRoute("article-export")]
[ApiExplorerSettings(GroupName = "Article Export")]
[Authorize(Policy = AuthorizationPolicies.RequireAdminAccess)]
public class ArticleExportController : ManagementApiControllerBase
{
    private readonly ArticleReportGenerator _generator;
    private readonly ILogger<ArticleExportController> _logger;

    public ArticleExportController(ArticleReportGenerator generator, ILogger<ArticleExportController> logger)
    {
        _generator = generator;
        _logger = logger;
    }

    [HttpGet("filters")]
    [MapToApiVersion("1.0")]
    [ProducesResponseType(typeof(FilterOptionsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [EndpointSummary("Filter options (providers, authors, languages) for the article export form.")]
    public async Task<IActionResult> Filters([FromQuery] string? language, CancellationToken cancellationToken)
    {
        string? culture = await _generator.ResolveCultureAsync(language);
        if (culture is null)
        {
            return BadRequest(UnknownLanguageProblem());
        }

        FilterOptionsResponse options = await _generator.GetFilterOptionsAsync(culture, cancellationToken);
        return Ok(options);
    }

    [HttpGet("export")]
    [MapToApiVersion("1.0")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [EndpointSummary("Generate a Word (.docx) report of the pages matching the filters.")]
    public async Task<IActionResult> Export([FromQuery] ExportFilters filters, CancellationToken cancellationToken)
    {
        string? culture = await _generator.ResolveCultureAsync(filters.Language);
        if (culture is null)
        {
            return BadRequest(UnknownLanguageProblem());
        }

        ArticleReport report = await _generator.BuildReportAsync(filters, culture, cancellationToken);
        _logger.LogInformation(
            "Article export generated {PageCount} pages for {User}",
            report.PageCount,
            User.Identity?.Name);

        return File(report.Content, ArticleReportGenerator.DocxContentType, report.FileName);
    }

    private static ProblemDetails UnknownLanguageProblem() => new()
    {
        Title = "Unknown language",
        Detail = "The requested language code is not a known, enabled language.",
        Status = StatusCodes.Status400BadRequest,
    };
}
