using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Infoportal.Adapters.Cloudflare.Services;

public class CloudflareCachePurgeService : ICloudflareCachePurgeService
{
    private static int _warnedAboutShortToken;

    private readonly HttpClient _http;
    private readonly IOptionsMonitor<CloudflareOptions> _options;
    private readonly ILogger<CloudflareCachePurgeService> _logger;

    public CloudflareCachePurgeService(
        HttpClient http,
        IOptionsMonitor<CloudflareOptions> options,
        ILogger<CloudflareCachePurgeService> logger)
    {
        _http = http;
        _options = options;
        _logger = logger;
    }

    public async Task PurgeUrlsAsync(IEnumerable<string> absoluteUrls, CancellationToken ct = default)
    {
        CloudflareOptions opts = _options.CurrentValue;
        if (!IsConfigured(opts)) return;

        string[] urls = absoluteUrls?.ToArray() ?? [];
        if (urls.Length == 0) return;

        foreach (string[] batch in Chunk(urls, Math.Max(1, opts.MaxUrlsPerRequest)))
        {
            await PostPurgeAsync(opts, new { files = batch }, ct);
        }
    }

    public Task PurgeEverythingAsync(CancellationToken ct = default)
    {
        CloudflareOptions opts = _options.CurrentValue;
        if (!IsConfigured(opts)) return Task.CompletedTask;

        return PostPurgeAsync(opts, new { purge_everything = true }, ct);
    }

    private bool IsConfigured(CloudflareOptions opts)
    {
        bool tokenMissing = string.IsNullOrWhiteSpace(opts.ApiToken);
        bool zoneMissing = string.IsNullOrWhiteSpace(opts.ZoneId);
        if (!opts.Enabled || tokenMissing || zoneMissing)
        {
            _logger.LogDebug(
                "Cloudflare adapter skipped — Enabled={Enabled}, ApiToken {TokenState}, ZoneId {ZoneState}",
                opts.Enabled,
                tokenMissing ? "empty" : "set",
                zoneMissing ? "empty" : "set");
            return false;
        }

        // 401-silently guard: real Cloudflare tokens are 40+ chars; a short value usually
        // means whitespace got pasted into the Key Vault entry.
        if (opts.ApiToken.Trim().Length < 40 && Interlocked.CompareExchange(ref _warnedAboutShortToken, 1, 0) == 0)
        {
            _logger.LogWarning(
                "Cloudflare ApiToken is shorter than expected (<40 chars) — likely Key Vault whitespace; will 401.");
        }

        return true;
    }

    private async Task PostPurgeAsync(CloudflareOptions opts, object body, CancellationToken ct)
    {
        using HttpRequestMessage request = new(
            HttpMethod.Post,
            $"client/v4/zones/{opts.ZoneId}/purge_cache")
        {
            // SECURITY: per-request header, NOT HttpClient.DefaultRequestHeaders — future
            // OTel enrichers on the typed client would capture the bearer into traces.
            Headers = { Authorization = new AuthenticationHeaderValue("Bearer", opts.ApiToken.Trim()) },
            Content = JsonContent.Create(body),
        };

        try
        {
            using HttpResponseMessage response = await _http.SendAsync(request, ct);
            response.EnsureSuccessStatusCode();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Cloudflare purge_cache call failed for zone {ZoneId}", opts.ZoneId);
            throw;
        }
    }

    private static IEnumerable<T[]> Chunk<T>(T[] source, int size)
    {
        for (int i = 0; i < source.Length; i += size)
        {
            int len = Math.Min(size, source.Length - i);
            T[] batch = new T[len];
            Array.Copy(source, i, batch, 0, len);
            yield return batch;
        }
    }
}
