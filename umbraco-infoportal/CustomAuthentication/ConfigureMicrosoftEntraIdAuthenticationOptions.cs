using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.Extensions.Options;

namespace umbraco_infoportal.CustomAuthentication;

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
        // Get Entra ID settings from configuration
        var clientId = _configuration["MicrosoftEntraId:ClientId"] ?? "YOUR_CLIENT_ID";
        var clientSecret = _configuration["MicrosoftEntraId:ClientSecret"] ?? "YOUR_CLIENT_SECRET";
        var tenantId = _configuration["MicrosoftEntraId:TenantId"] ?? "YOUR_TENANT_ID";

        // Callback path for Entra ID to redirect back to the application
        // This must match the redirect URI configured in your Azure app registration
        options.CallbackPath = "/signin-entra";

        // Get these values from your Azure Entra ID app registration
        options.ClientId = clientId;
        options.ClientSecret = clientSecret;
        options.Authority = $"https://login.microsoftonline.com/{tenantId}/v2.0";

        // Configure scopes
        options.Scope.Clear();
        options.Scope.Add("openid");
        options.Scope.Add("profile");
        options.Scope.Add("email");

        // Get claims from user info endpoint
        options.GetClaimsFromUserInfoEndpoint = true;

        // Configure claim mapping
        options.TokenValidationParameters.NameClaimType = "name";
        options.TokenValidationParameters.RoleClaimType = "roles";

        // Disable session cookie requirement for this flow
        options.NonceCookie.SecurePolicy = CookieSecurePolicy.Always;
        options.CorrelationCookie.SecurePolicy = CookieSecurePolicy.Always;
    }

    public void Configure(string? name, OpenIdConnectOptions options)
    {
        // Only configure if this is for the backoffice
        if (name == Umbraco.Cms.Api.Management.Security.BackOfficeAuthenticationBuilder.SchemeForBackOffice(
                MicrosoftEntraIdBackOfficeExternalLoginProviderOptions.SchemeName))
        {
            Configure(options);
        }
    }
}

