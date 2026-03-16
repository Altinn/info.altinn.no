using Microsoft.Extensions.Options;
using Umbraco.Cms.Api.Management.Security;
using Umbraco.Cms.Core;

namespace umbraco_infoportal.CustomAuthentication;

/// <summary>
/// Configuration options for Microsoft Entra ID (Azure AD) backoffice external login provider.
/// </summary>
public class MicrosoftEntraIdBackOfficeExternalLoginProviderOptions : IConfigureNamedOptions<BackOfficeExternalLoginProviderOptions>
{
    public const string SchemeName = "MicrosoftEntraId";

    public void Configure(string? name, BackOfficeExternalLoginProviderOptions options)
    {
        if (name != Constants.Security.BackOfficeExternalAuthenticationTypePrefix + SchemeName)
        {
            return;
        }

        Configure(options);
    }

    public void Configure(BackOfficeExternalLoginProviderOptions options)
    {
        // Auto-linking configuration
        options.AutoLinkOptions = new ExternalSignInAutoLinkOptions(
            // Set to true to enable auto-linking for Entra ID users
            autoLinkExternalAccount: false,
            // Specify User Groups - users will be assigned to these groups when auto-linked
            defaultUserGroups: ["editor"],
            // Use default culture from appsettings.json
            defaultCulture: null,
            // Allow manual linking/unlinking from backoffice
            allowManualLinking: true
        )
        {
            // Optional: Customize user before linking
            OnAutoLinking = (autoLinkUser, loginInfo) =>
            {
                // You can customize the user before it's linked.
                // For example, modify user's groups based on claims
                var nameClaim = loginInfo.Principal.FindFirst("name");
                if (nameClaim != null)
                {
                    autoLinkUser.Name = nameClaim.Value;
                }
            },

            // Optional: Customize user before saving on external login
            OnExternalLogin = (user, loginInfo) =>
            {
                // Sync the user's name based on claims from Entra ID
                var nameClaim = loginInfo.Principal.FindFirst("name");
                if (nameClaim != null)
                {
                    user.Name = nameClaim.Value;
                }

                return true;
            }
        };

        // Allow users to login with username/password (set to true to deny local login)
        options.DenyLocalLogin = false;
    }
}
