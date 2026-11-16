using System.Net;
using System.Text;
using System.Text.Json;
using Infoportal.Cms.Authentication;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Serilog;
using Serilog.Core;
using Serilog.Events;

namespace Infoportal.Cms.Tests.Authentication;

/// <summary>
/// Runs Entra's callback through the real OpenIdConnectHandler, with a token endpoint that answers
/// like Entra does when the same callback is sent twice (AADSTS54005: code already redeemed).
/// Every log event goes to two sinks: one through Serilog configured from the app's
/// appsettings.json (what reaches the alerts), and one without any filtering.
/// </summary>
public class EntraCodeAlreadyRedeemedTests
{
    private const string Scheme = "test-scheme";
    private const string AuthorizationEndpoint = "https://login.example.test/tenant/oauth2/v2.0/authorize";
    private const string CodeAlreadyRedeemed =
        "AADSTS54005: OAuth2 Authorization code was already redeemed, please retry with a new valid code or use an existing refresh token.";

    private const string HandlerCategory = "Microsoft.AspNetCore.Authentication.OpenIdConnect.OpenIdConnectHandler";
    private static readonly string OurCategory = typeof(ConfigureMicrosoftEntraIdAuthenticationOptions).FullName!;

    private readonly StubTokenEndpoint _tokenEndpoint = new();
    private readonly CollectingSink _alerted = new();
    private readonly CollectingSink _unfiltered = new();
    private readonly ServiceProvider _services;

    public EntraCodeAlreadyRedeemedTests()
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

        var appSettings = new ConfigurationBuilder().AddJsonFile(AppSettingsPath()).Build();
        var services = new ServiceCollection();
        services.AddLogging(logging => logging
            .AddSerilog(new LoggerConfiguration().ReadFrom.Configuration(appSettings).WriteTo.Sink(_alerted).CreateLogger(), dispose: true)
            .AddSerilog(new LoggerConfiguration().MinimumLevel.Verbose().WriteTo.Sink(_unfiltered).CreateLogger(), dispose: true));
        services.AddAuthentication().AddOpenIdConnect(Scheme, options =>
        {
            new ConfigureMicrosoftEntraIdAuthenticationOptions(configuration).Configure(options);
            // Skip metadata discovery, and answer token requests without Entra.
            options.Configuration = new OpenIdConnectConfiguration
            {
                AuthorizationEndpoint = AuthorizationEndpoint,
                TokenEndpoint = "https://login.example.test/tenant/oauth2/v2.0/token",
            };
            options.Backchannel = new HttpClient(_tokenEndpoint);
        });
        _services = services.BuildServiceProvider();
    }

    private IEnumerable<LogEvent> AlertedWarningsAndErrors => _alerted.Events.Where(e => e.Level >= LogEventLevel.Warning);

    [Fact]
    public async Task Code_already_redeemed_is_retried_once_without_warnings_or_errors()
    {
        _tokenEndpoint.Fail("invalid_grant", CodeAlreadyRedeemed);

        var callback = await CallbackAsync(await ChallengeAsync());

        Assert.Equal(StatusCodes.Status302Found, callback.Response.StatusCode);
        Assert.StartsWith(AuthorizationEndpoint, callback.Response.Headers.Location.ToString());
        Assert.Equal(1, _tokenEndpoint.Requests);
        Assert.Empty(AlertedWarningsAndErrors);
        Assert.Contains(_alerted.Events, e => e.Level == LogEventLevel.Information && Category(e) == OurCategory);
    }

    [Fact]
    public async Task Code_already_redeemed_again_after_retry_shows_error_page_and_logs_warning()
    {
        _tokenEndpoint.Fail("invalid_grant", CodeAlreadyRedeemed);
        var retry = await CallbackAsync(await ChallengeAsync());

        var second = await CallbackAsync(ReadEntraCallback(retry));

        Assert.Equal(StatusCodes.Status500InternalServerError, second.Response.StatusCode);
        Assert.Contains("<body class=\"failed\">", ReadBody(second));
        var warning = Assert.Single(AlertedWarningsAndErrors);
        Assert.Equal(LogEventLevel.Warning, warning.Level);
        Assert.Equal(OurCategory, Category(warning));
    }

    [Fact]
    public async Task Other_token_errors_are_not_retried_and_log_exactly_one_error()
    {
        // E.g. an expired client secret: nobody can log in, so this must still alert, once.
        _tokenEndpoint.Fail("invalid_client", "AADSTS7000222: The provided client secret keys for app 'client-id' are expired.");

        var callback = await CallbackAsync(await ChallengeAsync());

        Assert.Equal(StatusCodes.Status500InternalServerError, callback.Response.StatusCode);
        var error = Assert.Single(AlertedWarningsAndErrors);
        Assert.Equal(LogEventLevel.Error, error.Level);
        Assert.Equal(OurCategory, Category(error));
        Assert.Contains("AADSTS7000222", error.RenderMessage());
    }

    [Fact]
    public async Task Other_invalid_grant_errors_are_not_retried()
    {
        // invalid_grant covers more than a reused code (e.g. a PKCE mismatch), which can be persistent.
        _tokenEndpoint.Fail("invalid_grant", "AADSTS501481: The Code_Verifier does not match the code_challenge supplied in the authorization request.");

        var callback = await CallbackAsync(await ChallengeAsync());

        Assert.Equal(StatusCodes.Status500InternalServerError, callback.Response.StatusCode);
        Assert.Equal(LogEventLevel.Error, Assert.Single(AlertedWarningsAndErrors).Level);
    }

    [Fact]
    public async Task Handler_errors_reported_by_our_handler_are_filtered_out()
    {
        // The handler logs every token endpoint error twice at Error level (EventId 52 for the
        // response, 17 for the exception) before OnRemoteFailure runs. Without the filter in
        // appsettings.json every failure would alert three times.
        _tokenEndpoint.Fail("invalid_client", "AADSTS7000222: The provided client secret keys for app 'client-id' are expired.");

        await CallbackAsync(await ChallengeAsync());

        var handlerErrors = _unfiltered.Events
            .Where(e => e.Level == LogEventLevel.Error && Category(e) == HandlerCategory)
            .Select(EventIdOf)
            .Order();
        Assert.Equal([17, 52], handlerErrors);
        Assert.DoesNotContain(_alerted.Events, e => Category(e) == HandlerCategory && e.Level == LogEventLevel.Error);
    }

    // The backoffice login redirecting to Entra. Returns what Entra sends back on the callback.
    private async Task<EntraCallback> ChallengeAsync()
    {
        var context = NewContext();
        await context.ChallengeAsync(Scheme, new AuthenticationProperties { RedirectUri = "/umbraco/callback" });
        return ReadEntraCallback(context);
    }

    // Entra posting the code and state back (response_mode=form_post), with the browser's cookies.
    private async Task<HttpContext> CallbackAsync(EntraCallback callback)
    {
        var context = NewContext();
        context.Request.Method = HttpMethods.Post;
        context.Request.Path = "/signin-entra";
        context.Request.ContentType = "application/x-www-form-urlencoded";
        context.Request.Body = new MemoryStream(Encoding.UTF8.GetBytes(
            $"code=the-code&state={Uri.EscapeDataString(callback.State)}"));
        context.Request.Headers.Cookie = callback.Cookies;

        var handlers = context.RequestServices.GetRequiredService<IAuthenticationHandlerProvider>();
        var handler = (IAuthenticationRequestHandler)(await handlers.GetHandlerAsync(context, Scheme))!;
        Assert.True(await handler.HandleRequestAsync());
        return context;
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

    // The state from a redirect to Entra, and the correlation and nonce cookies set with it.
    private static EntraCallback ReadEntraCallback(HttpContext redirect)
    {
        var location = new Uri(redirect.Response.Headers.Location.ToString());
        var state = QueryHelpers.ParseQuery(location.Query)["state"].ToString();
        var cookies = string.Join("; ", redirect.Response.Headers.SetCookie.Select(header => header!.Split(';')[0]));
        return new EntraCallback(state, cookies);
    }

    private static string ReadBody(HttpContext context)
    {
        context.Response.Body.Position = 0;
        return new StreamReader(context.Response.Body).ReadToEnd();
    }

    private static string? Category(LogEvent logEvent) =>
        logEvent.Properties.GetValueOrDefault("SourceContext") is ScalarValue { Value: string category } ? category : null;

    private static int? EventIdOf(LogEvent logEvent) =>
        logEvent.Properties.GetValueOrDefault("EventId") is StructureValue eventId &&
        eventId.Properties.FirstOrDefault(p => p.Name == "Id")?.Value is ScalarValue { Value: int id }
            ? id
            : null;

    private static string AppSettingsPath()
    {
        for (var directory = new DirectoryInfo(AppContext.BaseDirectory); directory is not null; directory = directory.Parent)
        {
            var path = Path.Combine(directory.FullName, "umbraco-infoportal", "appsettings.json");
            if (File.Exists(path))
            {
                return path;
            }
        }

        throw new FileNotFoundException("umbraco-infoportal/appsettings.json not found above " + AppContext.BaseDirectory);
    }

    private sealed record EntraCallback(string State, string Cookies);

    // Answers every token request with the configured error, like Entra does.
    private sealed class StubTokenEndpoint : HttpMessageHandler
    {
        private string _error = string.Empty;
        private string _description = string.Empty;

        public int Requests { get; private set; }

        public void Fail(string error, string description) => (_error, _description) = (error, description);

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Requests++;
            var json = JsonSerializer.Serialize(new
            {
                error = _error,
                error_description = $"{_description} Trace ID: 00000000-0000-0000-0000-000000000000",
            });
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.BadRequest)
            {
                Content = new StringContent(json, Encoding.UTF8, "application/json"),
            });
        }
    }

    private sealed class CollectingSink : ILogEventSink
    {
        public List<LogEvent> Events { get; } = [];

        public void Emit(LogEvent logEvent) => Events.Add(logEvent);
    }
}
