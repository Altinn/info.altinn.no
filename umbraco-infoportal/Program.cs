using Azure.Extensions.AspNetCore.Configuration.Secrets;
using Azure.Identity;
using umbraco_infoportal.Options;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<KeyVaultOptions>(
    builder.Configuration.GetSection(KeyVaultOptions.SectionName));

KeyVaultOptions keyVaultOptions = builder.Configuration
    .GetSection(KeyVaultOptions.SectionName)
    .Get<KeyVaultOptions>() ?? new();

bool keyVaultEnabled = keyVaultOptions.Enabled ?? !builder.Environment.IsDevelopment();

if (keyVaultEnabled && !string.IsNullOrWhiteSpace(keyVaultOptions.AkvUri))
{
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
