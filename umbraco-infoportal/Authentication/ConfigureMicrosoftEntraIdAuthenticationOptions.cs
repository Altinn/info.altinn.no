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

        // A successful login ends any retry sequence.
        options.Events.OnTicketReceived = context =>
        {
            context.Response.Cookies.Delete(RetryCookieName, RetryCookieOptions());
            return Task.CompletedTask;
        };

        // The backoffice login auto-redirects to Entra, and with an active Entra session Entra
        // answers without user interaction. Redirecting every failure to /umbraco would therefore
        // loop forever on persistent failures (e.g. an expired client secret). Only stale attempts
        // (correlation cookie expired after RemoteAuthenticationTimeout, or the user pressed back
        // into Entra's /authorize URL, replaying an old state) are retried, and only once.
        options.Events.OnRemoteFailure = async context =>
        {
            var logger = context.HttpContext.RequestServices
                .GetRequiredService<ILogger<ConfigureMicrosoftEntraIdAuthenticationOptions>>();
            var message = context.Failure?.Message ?? string.Empty;
            var response = context.Response;
            context.HandleResponse();

            if (message.Contains("access_denied"))
            {
                // Redirecting to /umbraco would send the user straight back to Entra.
                logger.LogInformation("Entra ID login cancelled: {Reason}", message);
                response.Cookies.Delete(RetryCookieName, RetryCookieOptions());
                await EntraLoginMessagePage.WriteAsync(context.HttpContext, EntraLoginMessagePage.Kind.Cancelled);
                return;
            }

            if (message == "Correlation failed." && !context.Request.Cookies.ContainsKey(RetryCookieName))
            {
                // Logged-in users land in the backoffice, others get a fresh login attempt.
                logger.LogInformation("Entra ID login aborted (stale attempt), retrying once: {Reason}", message);
                var retryCookieOptions = RetryCookieOptions();
                retryCookieOptions.MaxAge = RetryWindow;
                response.Cookies.Append(RetryCookieName, "1", retryCookieOptions);
                response.Redirect("/umbraco");
                return;
            }

            // Persistent failure, or the retry failed too: stop instead of looping.
            // TraceId matches the error reference shown on the page.
            if (message == "Correlation failed.")
            {
                // Second stale attempt within the retry window. Can be a single user (back pressed
                // twice, browser dropping cookies), so log as a warning: errors trigger alerts.
                logger.LogWarning("Entra ID login failed again after retry: {Reason} (TraceId {TraceId})",
                    message, context.HttpContext.TraceIdentifier);
            }
            else
            {
                // Configuration or Entra problem (e.g. expired client secret): nobody can log in.
                logger.LogError(context.Failure, "Entra ID login failed: {Reason} (TraceId {TraceId})",
                    message, context.HttpContext.TraceIdentifier);
            }

            response.Cookies.Delete(RetryCookieName, RetryCookieOptions());
            await EntraLoginMessagePage.WriteAsync(context.HttpContext, EntraLoginMessagePage.Kind.Failed);
        };
    }

    // Marks that a stale login attempt was just retried. Must outlive one silent SSO round trip
    // (a few seconds), but should be short so a later back-button press is retried again.
    private const string RetryCookieName = "Infoportal.EntraLoginRetry";
    private static readonly TimeSpan RetryWindow = TimeSpan.FromSeconds(30);

    // SameSite=None: Entra returns via a cross-site form_post, which would not carry a Lax cookie.
    private static CookieOptions RetryCookieOptions() => new()
    {
        Path = "/",
        HttpOnly = true,
        Secure = true,
        SameSite = SameSiteMode.None,
        IsEssential = true,
    };

    public void Configure(string? name, OpenIdConnectOptions options)
    {
        if (name == Umbraco.Cms.Api.Management.Security.BackOfficeAuthenticationBuilder.SchemeForBackOffice(
                MicrosoftEntraIdBackOfficeExternalLoginProviderOptions.SchemeName))
        {
            Configure(options);
        }
    }
}