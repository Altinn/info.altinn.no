using Infoportal.Cms.Authentication;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Xunit;

namespace Infoportal.Cms.Tests.Authentication;

/// <summary>
/// Runs the retry through the real OpenIdConnectHandler (no Entra, no TestServer): the retried
/// challenge reuses the properties of the original one, which the handler has already filled in.
/// </summary>
public class EntraRetryChallengeTests
{
    private const string Scheme = "test-scheme";

    private readonly ServiceProvider _services;
    private readonly OpenIdConnectOptions _options;

    public EntraRetryChallengeTests()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["MicrosoftEntraId:ClientId"] = "client-id",
                ["MicrosoftEntraId:ClientSecret"] = "client-secret",
                ["MicrosoftEntraId:Authority"] = "https://login.example.test/tenant/v2.0",
                ["MicrosoftEntraId:CallbackPath"] = "/signin-entra",
            })
            .Build();

        var services = new ServiceCollection();
        services.AddLogging();
        services.AddAuthentication().AddOpenIdConnect(Scheme, options =>
        {
            new ConfigureMicrosoftEntraIdAuthenticationOptions(configuration).Configure(options);
            // Skip metadata discovery.
            options.Configuration = new OpenIdConnectConfiguration
            {
                AuthorizationEndpoint = "https://login.example.test/tenant/oauth2/v2.0/authorize",
            };
        });
        _services = services.BuildServiceProvider();
        _options = _services.GetRequiredService<IOptionsMonitor<OpenIdConnectOptions>>().Get(Scheme);
    }

    [Fact]
    public async Task Retry_challenge_redirects_to_entra()
    {
        var original = await ChallengeAsync(new AuthenticationProperties { RedirectUri = "/umbraco/callback" });

        var retry = await FailAsync(original);

        Assert.Equal(StatusCodes.Status302Found, retry.Response.StatusCode);
        var retried = ReadState(retry);
        Assert.Equal("/umbraco/callback", retried.RedirectUri);
    }

    [Fact]
    public async Task Failing_retry_shows_error_page()
    {
        var original = await ChallengeAsync(new AuthenticationProperties { RedirectUri = "/umbraco/callback" });
        var retry = await FailAsync(original);

        var second = await FailAsync(ReadState(retry));

        Assert.Equal(StatusCodes.Status500InternalServerError, second.Response.StatusCode);
    }

    private HttpContext NewContext()
    {
        // One scope per request, like ASP.NET Core: authentication handlers are cached per scope.
        var context = new DefaultHttpContext { RequestServices = _services.CreateScope().ServiceProvider };
        context.Request.Scheme = "https";
        context.Request.Host = new HostString("localhost");
        context.Response.Body = new MemoryStream();
        return context;
    }

    // The original challenge, as issued when the login screen redirects to Entra.
    private async Task<AuthenticationProperties> ChallengeAsync(AuthenticationProperties properties)
    {
        var context = NewContext();
        await context.ChallengeAsync(Scheme, properties);
        return ReadState(context);
    }

    // Entra's callback failing correlation, with the properties read back from the state.
    private async Task<HttpContext> FailAsync(AuthenticationProperties properties)
    {
        var context = NewContext();
        var scheme = new AuthenticationScheme(Scheme, null, typeof(OpenIdConnectHandler));
        var failure = new RemoteFailureContext(context, scheme, _options, new Exception("Correlation failed."))
        {
            Properties = properties,
        };
        await _options.Events.RemoteFailure(failure);
        return context;
    }

    // What Entra sends back: the state from the authorize redirect.
    private AuthenticationProperties ReadState(HttpContext context)
    {
        var location = new Uri(context.Response.Headers.Location.ToString());
        var state = Microsoft.AspNetCore.WebUtilities.QueryHelpers.ParseQuery(location.Query)["state"].ToString();
        var properties = _options.StateDataFormat.Unprotect(state);
        Assert.NotNull(properties);
        return properties!;
    }
}
