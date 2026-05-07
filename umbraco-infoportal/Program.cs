using Azure.Extensions.AspNetCore.Configuration.Secrets;
using Azure.Identity;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using umbraco_infoportal.Options;
using Umbraco.Cms.Core.Composing;


WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestHeadersTotalSize = 65536;
});

// Trust X-Forwarded-* from Cloudflare/Traefik so Request.Host reflects the
// public hostname (e.g. cms.at23.altinn.info), not the cluster origin.
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor
                             | ForwardedHeaders.XForwardedProto
                             | ForwardedHeaders.XForwardedHost;
    options.KnownIPNetworks.Clear();
    options.KnownProxies.Clear();
    options.AllowedHosts = new[]
    {
        "cms.at22.altinn.info",
        "cms.at23.altinn.info",
        "infoportal.at22.dis-core.altinn.cloud",
        "infoportal.at23.dis-core.altinn.cloud",
        "infoportal.tt02.dis-core.altinn.cloud",
        "infoportal.prod.dis-core.altinn.cloud"
    };
});

builder.Services.Configure<KeyVaultOptions>(
    builder.Configuration.GetSection(KeyVaultOptions.SectionName));

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

builder.CreateUmbracoBuilder()
    .AddBackOffice()
    .AddWebsite()
    .AddDeliveryApi()
    .AddComposers()
    .AddAzureBlobMediaFileSystem()
    .AddAzureBlobImageSharpCache()     
    .Build();

WebApplication app = builder.Build();

app.UseForwardedHeaders();

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
