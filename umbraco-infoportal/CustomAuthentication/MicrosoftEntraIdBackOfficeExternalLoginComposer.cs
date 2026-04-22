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
        builder.Services.ConfigureOptions<MicrosoftEntraIdBackOfficeExternalLoginProviderOptions>();
        builder.Services.ConfigureOptions<ConfigureMicrosoftEntraIdAuthenticationOptions>();

        builder.AddBackOfficeExternalLogins(logins =>
        {
            logins.AddBackOfficeLogin(
                backOfficeAuthenticationBuilder =>
                {
                    var schemeName = BackOfficeAuthenticationBuilder.SchemeForBackOffice(
                        MicrosoftEntraIdBackOfficeExternalLoginProviderOptions.SchemeName);

                    ArgumentNullException.ThrowIfNull(schemeName);

                    backOfficeAuthenticationBuilder.AddOpenIdConnect(
                        schemeName,
                        options =>
                        {
                            // Config handled elsewhere
                        });
                });
        });
    }
}