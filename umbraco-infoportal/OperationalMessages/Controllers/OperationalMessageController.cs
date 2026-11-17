using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Umbraco.Cms.Api.Management.Controllers;
using Umbraco.Cms.Api.Management.Routing;
using Umbraco.Cms.Core.Models.Membership;
using Umbraco.Cms.Core.Security;
using Umbraco.Cms.Web.Common.Authorization;
using Infoportal.Cms.OperationalMessages.Models;
using Infoportal.Cms.OperationalMessages.Services;

namespace Infoportal.Cms.OperationalMessages.Controllers;

[ApiVersion("1.0")]
[VersionedApiBackOfficeRoute("operational-messages")]
[ApiExplorerSettings(GroupName = "Operational Messages")]
[Authorize(Policy = AuthorizationPolicies.SectionAccessContent)]
public class OperationalMessageController : ManagementApiControllerBase
{
    private readonly OperationalMessagePublisher _publisher;
    private readonly IBackOfficeSecurityAccessor _backOfficeSecurityAccessor;

    public OperationalMessageController(
        OperationalMessagePublisher publisher,
        IBackOfficeSecurityAccessor backOfficeSecurityAccessor)
    {
        _publisher = publisher;
        _backOfficeSecurityAccessor = backOfficeSecurityAccessor;
    }

    [HttpGet("setup")]
    [MapToApiVersion("1.0")]
    [ProducesResponseType(typeof(OperationalMessageSetup), StatusCodes.Status200OK)]
    [EndpointSummary("Colour choices, and whether the start page has unpublished changes.")]
    public async Task<IActionResult> Setup() => Ok(await _publisher.GetSetupAsync());

    [HttpPost]
    [MapToApiVersion("1.0")]
    [ProducesResponseType(typeof(PublishedOperationalMessage), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    [EndpointSummary("Creates and publishes a driftsmelding (bokmål) and puts it first on the start page.")]
    public async Task<IActionResult> Publish([FromBody] PublishOperationalMessageRequest request)
    {
        IUser? user = _backOfficeSecurityAccessor.BackOfficeSecurity?.CurrentUser;
        if (user is null)
        {
            return Unauthorized();
        }

        (PublishedOperationalMessage? message, OperationalMessageError? error) =
            await _publisher.PublishAsync(request, user);

        if (error is null)
        {
            return Ok(message);
        }

        (int status, string title) = error.Kind switch
        {
            OperationalMessageErrorKind.Invalid => (StatusCodes.Status400BadRequest, "Ugyldig driftsmelding"),
            OperationalMessageErrorKind.Forbidden => (StatusCodes.Status403Forbidden, "Mangler tilgang"),
            OperationalMessageErrorKind.PendingStartPageChanges => (StatusCodes.Status409Conflict, "Startsiden har upubliserte endringer"),
            _ => (StatusCodes.Status500InternalServerError, "Kunne ikke legge ut driftsmeldingen"),
        };

        return StatusCode(status, new ProblemDetails { Title = title, Detail = error.Message, Status = status });
    }
}
