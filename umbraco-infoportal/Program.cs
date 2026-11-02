using Infoportal.Cms.Hosting;

// Most setup lives in the composers of each functional area (e.g. Hosting/HostingComposer.cs).
// Umbraco finds and runs every IComposer automatically in AddComposers().

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

// Must run before Umbraco reads configuration: appsettings.Local.json (Development) and Azure Key Vault.
builder.AddInfoportalConfiguration();

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
