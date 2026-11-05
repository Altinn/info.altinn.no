using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.Extensions.Options;

namespace Infoportal.Cms.Authentication;

/// <summary>
/// Configures OpenID Connect options for Microsoft Entra ID authentication.
/// </summary>
public class ConfigureMicrosoftEntraIdAuthenticationOptions : IConfigureNamedOptions<OpenIdConnectOptions>
{
    private readonly IConfiguration _configuration;

    public ConfigureMicrosoftEntraIdAuthenticationOptions(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public void Configure(OpenIdConnectOptions options)
    {
        var clientId = _configuration["MicrosoftEntraId:ClientId"]
            ?? throw new Exception("Missing MicrosoftEntraId:ClientId");

        var clientSecret = _configuration["MicrosoftEntraId:ClientSecret"]
            ?? throw new Exception("Missing MicrosoftEntraId:ClientSecret");

        var authority = _configuration["MicrosoftEntraId:Authority"]
            ?? throw new Exception("Missing MicrosoftEntraId:Authority");

        var callbackPath = _configuration["MicrosoftEntraId:CallbackPath"]
            ?? throw new Exception("Missing MicrosoftEntraId:CallbackPath");
            
        options.CallbackPath = callbackPath;
        options.ClientId = clientId;
        options.ClientSecret = clientSecret;
        options.Authority = authority;
        options.RequireHttpsMetadata = false;

        options.ResponseType = "code";

        options.Scope.Clear();
        options.Scope.Add("openid");
        options.Scope.Add("profile");
        options.Scope.Add("email");

        options.GetClaimsFromUserInfoEndpoint = true;

        // map groups 
        //options.ClaimActions.MapJsonKey("groups", "groups");

        // Set claim types to match what Entra ID provides
        options.TokenValidationParameters.NameClaimType = "name";
        options.TokenValidationParameters.RoleClaimType =
            "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

        options.SaveTokens = false;

        options.NonceCookie.SecurePolicy = CookieSecurePolicy.Always;
        options.CorrelationCookie.SecurePolicy = CookieSecurePolicy.Always;

        var applicationUrl = _configuration["Umbraco:CMS:Security:BackOfficeHost"];
        if (!string.IsNullOrEmpty(applicationUrl))
        {
            options.Events.OnRedirectToIdentityProvider = context =>
            {
                context.ProtocolMessage.RedirectUri =
                    $"{applicationUrl.TrimEnd('/')}{callbackPath}";
                return Task.CompletedTask;
            };
        }

        // Stale or abandoned login attempts (correlation cookie expired after
        // RemoteAuthenticationTimeout, or the user pressed back into Entra's /authorize URL
        // after logging in, replaying an old state) would otherwise surface as an unhandled
        // AuthenticationFailureException. Send the user back to the backoffice instead: an
        // already logged-in user just lands in the backoffice, others get the login page.
        options.Events.OnRemoteFailure = context =>
        {
            var logger = context.HttpContext.RequestServices
                .GetRequiredService<ILogger<ConfigureMicrosoftEntraIdAuthenticationOptions>>();
            var message = context.Failure?.Message ?? string.Empty;

            if (message == "Correlation failed." || message.Contains("access_denied"))
            {
                logger.LogInformation("Entra ID login aborted (stale or cancelled attempt): {Reason}", message);
            }
            else
            {
                logger.LogError(context.Failure, "Entra ID login failed: {Reason}", message);
            }

            context.Response.Redirect("/umbraco");
            context.HandleResponse();
            return Task.CompletedTask;
        };
    }

    public void Configure(string? name, OpenIdConnectOptions options)
    {
        if (name == Umbraco.Cms.Api.Management.Security.BackOfficeAuthenticationBuilder.SchemeForBackOffice(
                MicrosoftEntraIdBackOfficeExternalLoginProviderOptions.SchemeName))
        {
            Configure(options);
        }
    }
}