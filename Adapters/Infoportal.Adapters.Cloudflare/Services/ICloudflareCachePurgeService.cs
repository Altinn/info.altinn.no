namespace Infoportal.Adapters.Cloudflare.Services;

public interface ICloudflareCachePurgeService
{
    Task PurgeUrlsAsync(IEnumerable<string> absoluteUrls, CancellationToken ct = default);
    Task PurgeEverythingAsync(CancellationToken ct = default);
}
