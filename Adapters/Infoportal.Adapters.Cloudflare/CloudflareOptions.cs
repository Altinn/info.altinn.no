namespace Infoportal.Adapters.Cloudflare;

public class CloudflareOptions
{
    // ZoneId + ApiToken come from per-env Azure Key Vault via env vars (Cloudflare__ZoneId etc.).
    // Local dev: `dotnet user-secrets set "Cloudflare:ApiToken"` — never git-tracked appsettings.
    public bool Enabled { get; set; } = true;
    public string ZoneId { get; set; } = "";
    public string ApiToken { get; set; } = "";

    // Value lives in appsettings.json; overridable per-env for test scenarios (mock server).
    public string ApiHost { get; set; } = "";

    // Per-env public site URLs, looked up by EnvironmentResolver's parsed env name.
    public Dictionary<string, string> SiteBaseUrls { get; set; } = new();

    public int MaxUrlsPerRequest { get; set; } = 30;
    public int TimeoutSeconds { get; set; } = 5;
    public int AffectedUrlThreshold { get; set; } = 50;
}
