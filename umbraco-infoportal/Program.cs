using Azure.Extensions.AspNetCore.Configuration.Secrets;
using Azure.Identity;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

string? keyVaultUri = builder.Configuration["AkvUri"];

if (!string.IsNullOrWhiteSpace(keyVaultUri))
{
    if (!Uri.TryCreate(keyVaultUri, UriKind.Absolute, out Uri? keyVaultEndpoint))
    {
        throw new InvalidOperationException("Configuration value 'AkvUri' must be an absolute URI.");
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
