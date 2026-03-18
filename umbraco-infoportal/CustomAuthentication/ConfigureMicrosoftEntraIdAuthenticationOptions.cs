using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
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
        var clientId = _configuration["MicrosoftEntraId:ClientId"] ?? "YOUR_CLIENT_ID";
        var clientSecret = _configuration["MicrosoftEntraId:ClientSecret"] ?? "YOUR_CLIENT_SECRET";
        var authority = _configuration["MicrosoftEntraId:Authority"] ?? "https://login.microsoftonline.com/YOUR_TENANT_ID/v2.0";

        options.CallbackPath = "/signin-entra";

        options.ClientId = clientId;
        options.ClientSecret = clientSecret;
        options.Authority = authority;

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

        options.SaveTokens = true;

        options.NonceCookie.SecurePolicy = CookieSecurePolicy.Always;
        options.CorrelationCookie.SecurePolicy = CookieSecurePolicy.Always;
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