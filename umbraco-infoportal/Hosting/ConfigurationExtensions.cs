using Azure.Extensions.AspNetCore.Configuration.Secrets;
using Azure.Identity;

namespace Infoportal.Cms.Hosting;

public static class ConfigurationExtensions
{
    // Adds the configuration sources Umbraco needs before it starts. This can't be a composer,
    // because composers run after Umbraco has started reading its settings.
    public static WebApplicationBuilder AddInfoportalConfiguration(this WebApplicationBuilder builder)
    {
        // Local developer overrides, e.g. the connection string for a database copy
        // produced by scripts/db/refresh-local-db.sh. Git-ignored and Development-only,
        // so it can hold local credentials without any risk of being committed and
        // without diverging appsettings.Development.json from main.
        if (builder.Environment.IsDevelopment())
        {
            builder.Configuration.AddJsonFile("appsettings.Local.json", optional: true, reloadOnChange: true);
        }

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

        return builder;
    }
}
