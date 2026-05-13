using Azure.Extensions.AspNetCore.Configuration.Secrets;
using Azure.Identity;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using OpenTelemetry.Logs;
using OpenTelemetry.Trace;
using umbraco_infoportal.Options;
using Umbraco.Cms.Core.Composing;


WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestHeadersTotalSize = 65536;
});


builder.Services.Configure<KeyVaultOptions>(
    builder.Configuration.GetSection(KeyVaultOptions.SectionName));

builder.Services.Configure<SupportEmailOptions>(
    builder.Configuration.GetSection(SupportEmailOptions.SectionName));

KeyVaultOptions keyVaultOptions = builder.Configuration
    .GetSection(KeyVaultOptions.SectionName)
    .Get<KeyVaultOptions>() ?? new();

bool keyVaultEnabled = keyVaultOptions.Enabled ?? !builder.Environment.IsDevelopment();

if (keyVaultEnabled)
{
    if (string.IsNullOrWhiteSpace(keyVaultOptions.AkvUri))
    {
        throw new InvalidOperationException(
            $"Configuration value '{KeyVaultOptions.AkvUriKey}' must be configured when Key Vault is enabled.");
    }

    if (!Uri.TryCreate(keyVaultOptions.AkvUri, UriKind.Absolute, out Uri? keyVaultEndpoint))
    {
        throw new InvalidOperationException(
            $"Configuration value '{KeyVaultOptions.AkvUriKey}' must be an absolute URI.");
    }

    builder.Configuration.AddAzureKeyVault(keyVaultEndpoint, new DefaultAzureCredential());
}

// OpenTelemetry — only wire up if an OTLP endpoint is configured.
// In Kubernetes, OTEL_EXPORTER_OTLP_ENDPOINT, OTEL_SERVICE_NAME, and
// OTEL_RESOURCE_ATTRIBUTES are provided as environment variables by the
// deployment manifest. Locally these are typically unset, so OTEL is skipped.
string? otlpEndpoint = builder.Configuration["OTEL_EXPORTER_OTLP_ENDPOINT"];
if (!string.IsNullOrWhiteSpace(otlpEndpoint))
{
    Uri otlpUri = new(otlpEndpoint);

    builder.Logging.AddOpenTelemetry(log =>
    {
        log.IncludeScopes = true;
        log.IncludeFormattedMessage = true;
        log.ParseStateValues = true;
        log.AddOtlpExporter(opt => opt.Endpoint = otlpUri);
    });

    builder.Services.AddOpenTelemetry()
        .WithTracing(tracing => tracing
            .AddAspNetCoreInstrumentation(opt =>
            {
                opt.Filter = ctx =>
                {
                    PathString path = ctx.Request.Path;
                    return !path.StartsWithSegments("/umbraco/backoffice")
                        && !path.StartsWithSegments("/umbraco/management/api")
                        && !path.StartsWithSegments("/umbraco/preview")
                        && !path.StartsWithSegments("/css")
                        && !path.StartsWithSegments("/scripts")
                        && !path.StartsWithSegments("/media")
                        && !path.StartsWithSegments("/lib");
                };
            })
            .AddHttpClientInstrumentation(opt =>
            {
                opt.FilterHttpRequestMessage = req =>
                {
                    string? host = req.RequestUri?.Host;
                    if (host is null) return true;
                    return !host.EndsWith(".vault.azure.net", StringComparison.OrdinalIgnoreCase)
                        && !host.EndsWith(".blob.core.windows.net", StringComparison.OrdinalIgnoreCase)
                        && !host.EndsWith(".queue.core.windows.net", StringComparison.OrdinalIgnoreCase)
                        && !host.EndsWith(".table.core.windows.net", StringComparison.OrdinalIgnoreCase)
                        && !host.Equals("login.microsoftonline.com", StringComparison.OrdinalIgnoreCase)
                        && !host.Equals("login.windows.net", StringComparison.OrdinalIgnoreCase)
                        && !host.EndsWith("our.umbraco.com", StringComparison.OrdinalIgnoreCase)
                        && !host.EndsWith("telemetry.umbraco.com", StringComparison.OrdinalIgnoreCase);
                };
            })
            .AddOtlpExporter(opt => opt.Endpoint = otlpUri));
}

builder.CreateUmbracoBuilder()
    .AddBackOffice()
    .AddWebsite()
    .AddDeliveryApi()
    .AddComposers()
    .AddAzureBlobMediaFileSystem()
    .AddAzureBlobImageSharpCache()     
    .Build();

WebApplication app = builder.Build();

await app.BootUmbracoAsync();

app.UseUmbraco()
    .WithMiddleware(u =>
    {
        u.UseBackOffice();
        u.UseWebsite();
    })
    .WithEndpoints(u =>
    {
        u.UseBackOfficeEndpoints();
        u.UseWebsiteEndpoints();
    });

await app.RunAsync();
