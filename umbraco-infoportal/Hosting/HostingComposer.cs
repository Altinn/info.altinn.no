using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Infrastructure.Runtime.RuntimeModeValidators;
using Umbraco.Cms.Web.Common.ApplicationBuilder;
using Infoportal.Cms.Hosting.Services;

namespace Infoportal.Cms.Hosting;

public class HostingComposer : IComposer
{
    private const string BackOfficeHostKey = "Umbraco:CMS:Security:BackOfficeHost";

    public void Compose(IUmbracoBuilder builder)
    {
        // TLS is terminated at the cluster ingress, so the container itself only serves HTTP.
        builder.RuntimeModeValidators().Remove<UseHttpsValidator>();

        builder.Services.Configure<KestrelServerOptions>(options =>
        {
            options.Limits.MaxRequestHeadersTotalSize = 65536;
        });

        // Honor X-Forwarded-Proto/For from the cluster ingress (Traefik) so Request.Scheme
        // reflects the original https scheme. Required for OIDC correlation cookies set
        // with SecurePolicy.Always to round-trip correctly.
        builder.Services.Configure<ForwardedHeadersOptions>(options =>
        {
            options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto | ForwardedHeaders.XForwardedHost;
            options.KnownIPNetworks.Clear();
            options.KnownProxies.Clear();
        });

        builder.Services.AddSingleton<EnvironmentResolver>();

        // PrePipeline runs before any of Umbraco's own middleware, so the scheme and host
        // are corrected before Umbraco, routing and authentication read them.
        builder.Services.Configure<UmbracoPipelineOptions>(options =>
        {
            options.AddFilter(new UmbracoPipelineFilter("ReverseProxy")
            {
                PrePipeline = app =>
                {
                    app.UseForwardedHeaders();
                    UseBackOfficeHost(app, builder.Config[BackOfficeHostKey]);
                }
            });
        });
    }

    // The cluster gateway does not forward X-Forwarded-Host, so Request.Host is always
    // the internal hostname (infoportal.*.dis-core.altinn.cloud). Umbraco builds OAuth
    // redirects and media URLs from Request.Host, which breaks login and thumbnails in
    // environments where the internal hostname is IP-filtered (prod) or differs from the
    // public hostname. Override Host to BackOfficeHost so all URL generation is correct.
    private static void UseBackOfficeHost(IApplicationBuilder app, string? configuredBackOfficeHost)
    {
        if (string.IsNullOrEmpty(configuredBackOfficeHost) ||
            !Uri.TryCreate(configuredBackOfficeHost, UriKind.Absolute, out Uri? backOfficeUri))
        {
            return;
        }

        app.Use(async (context, next) =>
        {
            if (!context.Request.Host.Host.Equals(backOfficeUri.Host, StringComparison.OrdinalIgnoreCase))
            {
                context.Request.Host = new HostString(backOfficeUri.Host);
            }
            await next(context);
        });
    }
}
