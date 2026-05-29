using Microsoft.Extensions.Options;
using Umbraco.Cms.Api.Management.Security;
using Umbraco.Cms.Core;
using System.Security.Claims;

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
            defaultUserGroups: Array.Empty<string>(),
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
                // Sync navn
                var nameClaim = loginInfo.Principal.FindFirst("name");
                if (nameClaim != null)
                {
                    user.Name = nameClaim.Value;
                }

                // Hent App Roles fra Entra
                var roles = loginInfo.Principal
                    .FindAll(ClaimTypes.Role)
                    .Select(r => r.Value)
                    .ToList();

                var mappedGroups = new List<string>();

                //  Mapping: App Role til Umbraco gruppe
                if (roles.Contains("umbraco-admin"))
                    mappedGroups.Add("admin");

                if (roles.Contains("umbraco-redaktor"))
                    mappedGroups.Add("editor");

                if (roles.Contains("umbraco-aordningen"))
                    mappedGroups.Add("tjenesterAOrdningen");

                if (roles.Contains("umbraco-brg"))
                    mappedGroups.Add("tjenesterBrg");

                if (roles.Contains("umbraco-dat"))
                    mappedGroups.Add("tjenesterDat");

                 if (roles.Contains("umbraco-fd"))
                    mappedGroups.Add("tjenesterFd");

                 if (roles.Contains("umbraco-krt"))
                    mappedGroups.Add("tjenesterKrt");

                if (roles.Contains("umbraco-mdir"))
                    mappedGroups.Add("tjenesterMdir");
                
                 if (roles.Contains("umbraco-skatt"))
                    mappedGroups.Add("tjenesterSkatt");
                
                 if (roles.Contains("umbraco-slf"))
                    mappedGroups.Add("tjenesterSlf");
                
                 if (roles.Contains("umbraco-ssb"))
                    mappedGroups.Add("tjenesterSsb");

                if (roles.Contains("umbraco-staf"))
                    mappedGroups.Add("tjenesterStaf");
                
                if (roles.Contains("umbraco-beredskapsvakt"))
                    mappedGroups.Add("beredskapsvakt");
                
                if (roles.Contains("umbraco-servicedesk"))
                    mappedGroups.Add("servicedesk");
                
                if (roles.Contains("umbraco-tad"))
                    mappedGroups.Add("tjenesterTad");

                // Deny om ingen andre er roller er spesifisert
                if (!mappedGroups.Any())
                {
                    return false;
                }

                // Sett roller i Umbraco
                user.Roles.Clear();
                foreach (var group in mappedGroups)
                {
                    user.AddRole(group);
                }

                return true;
            }
        };

        options.DenyLocalLogin = true;
        options.AutoRedirectLoginToExternalProvider = true;
    }
}