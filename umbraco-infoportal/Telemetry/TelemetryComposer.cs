using OpenTelemetry.Trace;
using Umbraco.Cms.Core.Composing;

namespace Infoportal.Cms.Telemetry;

// OpenTelemetry tracing — only wired up if an OTLP endpoint is configured.
// In Kubernetes, OTEL_EXPORTER_OTLP_ENDPOINT, OTEL_SERVICE_NAME, and
// OTEL_RESOURCE_ATTRIBUTES are provided as environment variables by the
// deployment manifest. Locally these are typically unset, so OTEL is skipped.
// Logs are bridged from Umbraco's Serilog pipeline via Serilog.Sinks.OpenTelemetry
// configured in appsettings.Production.json — registering an OTel log provider
// here would be wiped out by Umbraco's ClearProviders() in CreateUmbracoBuilder.
public class TelemetryComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder)
    {
        string? otlpEndpoint = builder.Config["OTEL_EXPORTER_OTLP_ENDPOINT"];
        if (string.IsNullOrWhiteSpace(otlpEndpoint))
        {
            return;
        }

        Uri otlpUri = new(otlpEndpoint);
        string? cloudflareApiHost = builder.Config["Cloudflare:ApiHost"];

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
                            && !host.EndsWith("telemetry.umbraco.com", StringComparison.OrdinalIgnoreCase)
                            && !host.Equals(cloudflareApiHost, StringComparison.OrdinalIgnoreCase);
                    };
                })
                .AddOtlpExporter(opt => opt.Endpoint = otlpUri));
    }
}
