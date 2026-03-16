using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.Extensions.Options;
using Umbraco.Cms.Api.Management.Security;
using Umbraco.Cms.Core.Composing;

namespace umbraco_infoportal.CustomAuthentication;

/// <summary>
/// Composer for registering Microsoft Entra ID authentication in Umbraco backoffice.
/// </summary>
public class MicrosoftEntraIdBackOfficeExternalLoginComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder)
    {
        // Register the Entra ID login provider options (auto linking, manual linking, etc.)
        builder.Services.ConfigureOptions<MicrosoftEntraIdBackOfficeExternalLoginProviderOptions>();

        // Register the OpenID Connect authentication options
        builder.Services.ConfigureOptions<ConfigureMicrosoftEntraIdAuthenticationOptions>();

        // Add the backoffice external login with Entra ID
        builder.AddBackOfficeExternalLogins(logins =>
        {
            logins.AddBackOfficeLogin(
                backOfficeAuthenticationBuilder =>
                {
                    var schemeName = BackOfficeAuthenticationBuilder.SchemeForBackOffice(
                        MicrosoftEntraIdBackOfficeExternalLoginProviderOptions.SchemeName);

                    ArgumentNullException.ThrowIfNull(schemeName);

                    // Add OpenID Connect provider for Entra ID
                    backOfficeAuthenticationBuilder.AddOpenIdConnect(
                        schemeName,
                        options =>
                        {
                            // Configuration is handled by ConfigureMicrosoftEntraIdAuthenticationOptions
                        });
                });
        });
    }
}
