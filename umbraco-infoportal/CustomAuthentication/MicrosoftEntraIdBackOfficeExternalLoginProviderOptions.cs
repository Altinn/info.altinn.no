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
        options.AutoLinkOptions = new ExternalSignInAutoLinkOptions(
            autoLinkExternalAccount: true,
            defaultUserGroups: [],
            defaultCulture: null,
            allowManualLinking: true
        )
        {
            OnAutoLinking = (autoLinkUser, loginInfo) =>
            {
                var nameClaim = loginInfo.Principal.FindFirst("name");
                if (nameClaim != null)
                {
                    autoLinkUser.Name = nameClaim.Value;
                }
            },

            OnExternalLogin = (user, loginInfo) =>
            {
                // 🔤 Sync navn
                var nameClaim = loginInfo.Principal.FindFirst("name");
                if (nameClaim != null)
                {
                    user.Name = nameClaim.Value;
                }

                // Hent Entra grupper (GUIDs)
                var groupClaims = loginInfo.Principal
                    .FindAll("groups")
                    .Select(c => c.Value)
                    .ToList();

                // Mapping: Entra Group GUID → Umbraco grupper
                var mappedGroups = new List<string>();

                // TODO: Bytt ut med ekte GUIDs fra Entra ID
                if (groupClaims.Contains("950fd95d-e202-4d66-8739-13bcc58b150b"))
                    mappedGroups.Add("admin");

                if (groupClaims.Contains("df301fe8-14aa-4123-be58-a09f6960c1ab"))
                    mappedGroups.Add("editor");

                // if (groupClaims.Contains("GUID-WRITER-GROUP"))
                //     mappedGroups.Add("writer");

                // fallback hvis ingen match
                if (!mappedGroups.Any())
                {
                    mappedGroups.Add("writer");
                }

                // Oppdater roller i Umbraco
                user.Roles.Clear();
                foreach (var group in mappedGroups)
                {
                    user.AddRole(group);
                }

                return true;
            }
        };

        options.DenyLocalLogin = false;
    }
}