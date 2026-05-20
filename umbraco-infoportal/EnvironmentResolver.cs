using Microsoft.Extensions.Configuration;

namespace umbraco_infoportal;

// Parses the deployment env name (at22/at23/tt02/prod) out of the per-env
// Umbraco:CMS:Security:BackOfficeHost value. Non-prod: `cms.{env}.altinn.info`.
public class EnvironmentResolver
{
    private const string BackOfficeHostKey = "Umbraco:CMS:Security:BackOfficeHost";

    public string EnvironmentName { get; }

    public EnvironmentResolver(IConfiguration configuration)
    {
        EnvironmentName = ParseEnvFromBackOfficeHost(configuration[BackOfficeHostKey]) ?? string.Empty;
    }

    private static string? ParseEnvFromBackOfficeHost(string? url)
    {
        if (string.IsNullOrWhiteSpace(url)) return null;
        if (!Uri.TryCreate(url, UriKind.Absolute, out Uri? uri)) return null;

        string[] parts = uri.Host.Split('.');
        if (parts.Length < 3 || !parts[0].Equals("cms", StringComparison.OrdinalIgnoreCase))
            return null;

        // Base domain is altinn.info (2 labels). With the cms prefix that's 3 labels and
        // no env segment → prod. A 4th label is the env: cms.{env}.altinn.info.
        if (parts.Length == 3) return "prod";

        string candidate = parts[1].Trim();
        return string.IsNullOrEmpty(candidate) ? null : candidate;
    }

    public string ResolveForCurrentEnvironment(
        IReadOnlyDictionary<string, string> perEnv,
        string fallback = "")
    {
        if (string.IsNullOrEmpty(EnvironmentName)) return fallback;
        return perEnv.TryGetValue(EnvironmentName, out string? value) && !string.IsNullOrEmpty(value)
            ? value
            : fallback;
    }
}
