using System.Security.Claims;
using Infoportal.Cms.Authentication;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Xunit;

namespace Infoportal.Cms.Tests.Authentication;

/// <summary>
/// Tests the OnRemoteFailure handler: which failures are retried, which show the message page,
/// and that a browser dropping cookies on the callback cannot cause a redirect loop.
/// </summary>
public class EntraRemoteFailureTests
{
    // Message RemoteAuthenticationHandler uses when the correlation cookie is missing or invalid.
    private const string CorrelationFailed = "Correlation failed.";

    private readonly OpenIdConnectOptions _options = new();
    private readonly RecordingAuthenticationService _authentication = new();
    private readonly RecordingLogger _logger = new();

    public EntraRemoteFailureTests()
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

        new ConfigureMicrosoftEntraIdAuthenticationOptions(configuration).Configure(_options);
    }

    [Fact]
    public async Task Cancelled_login_shows_cancelled_page()
    {
        var failure = new OpenIdConnectProtocolException("Message contains error: 'access_denied'");
        failure.Data["error"] = "access_denied";

        var (context, result) = await FailAsync(failure, new AuthenticationProperties());

        Assert.True(result.Result?.Handled);
        Assert.Equal(StatusCodes.Status200OK, context.Response.StatusCode);
        Assert.Contains("<body class=\"cancelled\">", ReadBody(context));
        Assert.Empty(_authentication.Challenges);
        Assert.Equal(LogLevel.Information, Assert.Single(_logger.Levels));
    }

    [Fact]
    public async Task First_stale_attempt_is_retried_with_the_original_properties()
    {
        var properties = new AuthenticationProperties { RedirectUri = "/umbraco/callback" };

        var (_, result) = await FailAsync(new Exception(CorrelationFailed), properties);

        Assert.True(result.Result?.Handled);
        var challenge = Assert.Single(_authentication.Challenges);
        Assert.Equal("test-scheme", challenge.Scheme);
        Assert.Equal("/umbraco/callback", challenge.Properties?.RedirectUri);
        Assert.Equal(LogLevel.Information, Assert.Single(_logger.Levels));
    }

    [Fact]
    public async Task Browser_dropping_cookies_gets_error_page_after_one_retry()
    {
        // A browser that never sends cookies on Entra's callback fails correlation every time.
        // The retry must be detected from the state Entra sends back, not from a cookie.
        await FailAsync(new Exception(CorrelationFailed), new AuthenticationProperties());
        var retriedProperties = Assert.Single(_authentication.Challenges).Properties;

        var (context, _) = await FailAsync(new Exception(CorrelationFailed), retriedProperties);

        Assert.Single(_authentication.Challenges);
        Assert.Equal(StatusCodes.Status500InternalServerError, context.Response.StatusCode);
        Assert.Contains("<body class=\"failed\">", ReadBody(context));
        Assert.Equal([LogLevel.Information, LogLevel.Warning], _logger.Levels);
    }

    [Fact]
    public async Task Stale_attempt_without_state_shows_error_page()
    {
        var (context, _) = await FailAsync(new Exception(CorrelationFailed), properties: null);

        Assert.Empty(_authentication.Challenges);
        Assert.Equal(StatusCodes.Status500InternalServerError, context.Response.StatusCode);
    }

    [Fact]
    public async Task Other_failures_show_error_page_and_log_error()
    {
        var failure = new OpenIdConnectProtocolException("Message contains error: 'invalid_client'");
        failure.Data["error"] = "invalid_client";

        var (context, _) = await FailAsync(failure, new AuthenticationProperties());

        Assert.Empty(_authentication.Challenges);
        Assert.Equal(StatusCodes.Status500InternalServerError, context.Response.StatusCode);
        Assert.Contains("<body class=\"failed\">", ReadBody(context));
        Assert.Equal(LogLevel.Error, Assert.Single(_logger.Levels));
    }

    private async Task<(HttpContext Context, RemoteFailureContext Result)> FailAsync(
        Exception failure, AuthenticationProperties? properties)
    {
        var services = new ServiceCollection()
            .AddSingleton<IAuthenticationService>(_authentication)
            .AddSingleton<ILogger<ConfigureMicrosoftEntraIdAuthenticationOptions>>(_logger)
            .BuildServiceProvider();

        var httpContext = new DefaultHttpContext { RequestServices = services };
        httpContext.Response.Body = new MemoryStream();

        var scheme = new AuthenticationScheme("test-scheme", null, typeof(OpenIdConnectHandler));
        var failureContext = new RemoteFailureContext(httpContext, scheme, _options, failure)
        {
            Properties = properties,
        };

        await _options.Events.RemoteFailure(failureContext);
        return (httpContext, failureContext);
    }

    private static string ReadBody(HttpContext context)
    {
        context.Response.Body.Position = 0;
        return new StreamReader(context.Response.Body).ReadToEnd();
    }

    private sealed class RecordingAuthenticationService : IAuthenticationService
    {
        public List<(string? Scheme, AuthenticationProperties? Properties)> Challenges { get; } = [];

        public Task ChallengeAsync(HttpContext context, string? scheme, AuthenticationProperties? properties)
        {
            Challenges.Add((scheme, properties));
            return Task.CompletedTask;
        }

        public Task<AuthenticateResult> AuthenticateAsync(HttpContext context, string? scheme) =>
            throw new NotSupportedException();

        public Task ForbidAsync(HttpContext context, string? scheme, AuthenticationProperties? properties) =>
            throw new NotSupportedException();

        public Task SignInAsync(HttpContext context, string? scheme, ClaimsPrincipal principal,
            AuthenticationProperties? properties) => throw new NotSupportedException();

        public Task SignOutAsync(HttpContext context, string? scheme, AuthenticationProperties? properties) =>
            throw new NotSupportedException();
    }

    private sealed class RecordingLogger : ILogger<ConfigureMicrosoftEntraIdAuthenticationOptions>
    {
        public List<LogLevel> Levels { get; } = [];

        public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;

        public bool IsEnabled(LogLevel logLevel) => true;

        public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception,
            Func<TState, Exception?, string> formatter) => Levels.Add(logLevel);
    }
}
