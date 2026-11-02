using Umbraco.Cms.Api.Management.Security;
using Umbraco.Cms.Core.Manifest;
using Umbraco.Cms.Infrastructure.Manifest;

namespace Infoportal.Cms.Authentication;

/// <summary>
/// Registers the backoffice login button for Microsoft Entra ID. Registered only when Entra ID
/// is enabled, so the login screen does not auto-redirect to an unconfigured provider (e.g. on localhost).
/// </summary>
public class MicrosoftEntraIdPackageManifestReader : IPackageManifestReader
{
    public Task<IEnumerable<PackageManifest>> ReadPackageManifestsAsync()
    {
        var manifest = new PackageManifest
        {
            Name = "Microsoft Entra ID Authentication",
            AllowPublicAccess = true,
            Extensions =
            [
                new
                {
                    type = "authProvider",
                    alias = "Altinn.AuthProvider.MicrosoftEntraId",
                    name = "Microsoft Entra ID Auth Provider",
                    forProviderName = BackOfficeAuthenticationBuilder.SchemeForBackOffice(
                        MicrosoftEntraIdBackOfficeExternalLoginProviderOptions.SchemeName),
                    meta = new
                    {
                        label = "Microsoft",
                        defaultView = new { icon = "icon-microsoft", color = "default" },
                        behavior = new { autoRedirect = true },
                        linking = new { allowManualLinking = true },
                    },
                },
            ],
        };

        return Task.FromResult<IEnumerable<PackageManifest>>([manifest]);
    }
}
