using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Umbraco.Cms.Api.Management.Controllers;
using Umbraco.Cms.Api.Management.Routing;
using Umbraco.Cms.Core.PublishedCache;
using Umbraco.Cms.Core.Models.PublishedContent;

namespace umbraco_infoportal.MaintenanceBanner.Controllers;

[ApiVersion("1.0")]
[VersionedApiBackOfficeRoute("maintenance-banner")]
[ApiExplorerSettings(GroupName = "Maintenance Banner")]
[AllowAnonymous]
public class MaintenanceBannerController : ManagementApiControllerBase
{
    private readonly ILogger<MaintenanceBannerController> _logger;
    private readonly IPublishedContentCache _publishedContentCache;

    private static readonly Guid maintenanceMessageGuid = Guid.Parse("b4a49e28-bfa4-4d92-bb72-b1bfc28df335");

    public MaintenanceBannerController(IPublishedContentCache publishedContentCache, ILogger<MaintenanceBannerController> logger)
    {
        _publishedContentCache = publishedContentCache;
        _logger = logger;
    }

    [HttpGet("message")]
    [MapToApiVersion("1.0")]
    [ProducesResponseType(typeof(string), StatusCodes.Status200OK)]
    [EndpointSummary("Endpoint for getting active maintenance message to show in Umbraco header")]
    public async Task<IActionResult> Message()
    {
        IPublishedContent content = _publishedContentCache.GetById(maintenanceMessageGuid);
        bool showMessage = (bool) content.GetProperty("showMessage").GetValue();

        if (!showMessage)
        {
            return Ok("");
        }

        string message = (string) content.GetProperty("message")?.GetValue();
        
        return Ok(message);
    }
}
