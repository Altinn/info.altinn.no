using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OAuth;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;

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

        // The backoffice login auto-redirects to Entra, and with an active Entra session Entra
        // answers without user interaction. Redirecting every failure back to the login would
        // therefore loop forever on persistent failures (e.g. an expired client secret). Only stale
        // attempts are retried, and only once:
        // - the correlation cookie expired after RemoteAuthenticationTimeout, or the user pressed
        //   back into Entra's /authorize URL, replaying an old state;
        // - the same callback reached us twice (reload or double submit while the first one was
        //   still running), so Entra had already redeemed the code (AADSTS54005).
        options.Events.OnRemoteFailure = async context =>
        {
            var logger = context.HttpContext.RequestServices
                .GetRequiredService<ILogger<ConfigureMicrosoftEntraIdAuthenticationOptions>>();
            var message = context.Failure?.Message ?? string.Empty;
            context.HandleResponse();

            if (context.Failure is OpenIdConnectProtocolException protocolException &&
                protocolException.Data["error"] as string == "access_denied")
            {
                // Redirecting to /umbraco would send the user straight back to Entra.
                logger.LogInformation("Entra ID login cancelled: {Reason}", message);
                await EntraLoginMessagePage.WriteAsync(context.HttpContext, EntraLoginMessagePage.Kind.Cancelled);
                return;
            }

            // The retry marker travels in the protected OIDC state, not in a cookie: a browser that
            // drops the correlation cookie on Entra's cross-site callback would drop a retry cookie
            // too, and every callback would look like a first attempt.
            var properties = context.Properties;
            var isStaleAttempt = (message == CorrelationFailedMessage || IsCodeAlreadyRedeemed(context.Failure))
                && properties is not null;
            if (isStaleAttempt && !properties!.Items.ContainsKey(RetryMarker))
            {
                // Same properties as the original challenge, so Umbraco's callback and return URL
                // are kept. Logged-in users pass through Entra silently and land in the backoffice.
                // The handler adds a fresh PKCE verifier and code redirect URI on every challenge
                // (and throws if they are already there), so drop the ones from the stale attempt.
                logger.LogInformation("Entra ID login aborted (stale attempt), retrying once: {Reason}", message);
                properties.Items.Remove(OAuthConstants.CodeVerifierKey);
                properties.Items.Remove(OpenIdConnectDefaults.RedirectUriForCodePropertiesKey);
                properties.Items[RetryMarker] = "1";
                await context.HttpContext.ChallengeAsync(context.Scheme.Name, properties);
                return;
            }

            // Persistent failure, or the retry failed too: stop instead of looping.
            // TraceId matches the error reference shown on the page.
            if (isStaleAttempt)
            {
                // The retry failed as well. Can be a single user (back pressed twice, reloading
                // the callback twice, browser dropping cookies), so log as a warning: errors
                // trigger alerts.
                logger.LogWarning("Entra ID login failed again after retry: {Reason} (TraceId {TraceId})",
                    message, context.HttpContext.TraceIdentifier);
            }
            else
            {
                // Configuration or Entra problem (e.g. expired client secret): nobody can log in.
                logger.LogError(context.Failure, "Entra ID login failed: {Reason} (TraceId {TraceId})",
                    message, context.HttpContext.TraceIdentifier);
            }

            await EntraLoginMessagePage.WriteAsync(context.HttpContext, EntraLoginMessagePage.Kind.Failed);
        };
    }

    // Failure message from RemoteAuthenticationHandler when the correlation cookie is missing or invalid.
    private const string CorrelationFailedMessage = "Correlation failed.";

    // Set in the authentication properties (protected into the OIDC state) when a stale attempt is retried.
    private const string RetryMarker = "Infoportal.EntraLoginRetry";

    // Entra's answer when an authorization code is redeemed a second time. Only this code is
    // retried: other invalid_grant errors (e.g. a PKCE mismatch) can be persistent and must be seen.
    private const string CodeAlreadyRedeemedError = "AADSTS54005";

    private static bool IsCodeAlreadyRedeemed(Exception? failure) =>
        failure is OpenIdConnectProtocolException exception &&
        exception.Data["error"] as string == "invalid_grant" &&
        (exception.Data["error_description"] as string)?.StartsWith(CodeAlreadyRedeemedError, StringComparison.Ordinal) == true;

    public void Configure(string? name, OpenIdConnectOptions options)
    {
        if (name == Umbraco.Cms.Api.Management.Security.BackOfficeAuthenticationBuilder.SchemeForBackOffice(
                MicrosoftEntraIdBackOfficeExternalLoginProviderOptions.SchemeName))
        {
            Configure(options);
        }
    }
}