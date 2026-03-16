WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

// Load Entra ID configuration from appsettings
var entraConfig = builder.Configuration.GetSection("MicrosoftEntraId");
builder.Services.Configure<EntraIdSettings>(entraConfig);

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

/// <summary>
/// Settings for Microsoft Entra ID configuration.
/// </summary>
public class EntraIdSettings
{
    public string ClientId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
    public string TenantId { get; set; } = string.Empty;
}
