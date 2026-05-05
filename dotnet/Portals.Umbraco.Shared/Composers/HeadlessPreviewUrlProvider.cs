using Kjac.HeadlessPreview.Models;
using Kjac.HeadlessPreview.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Routing;
using Umbraco.Cms.Core.Services;

namespace Portals.Shared.Composers;

public class HeadlessPreviewComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder)
        => builder.Services.TryAddSingleton<IDocumentPreviewService, InfoPortalPreviewService>();
}

public class InfoPortalPreviewService : IDocumentPreviewService
{
    private const int PreviewLinkLifetimeMinutes = 5;

    private static readonly HashSet<string> PageContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "startPage",
        "themePage",
        "themeContainerPage",
        "sectionPage",
        "sectionArticlePage",
        "newsArchive",
        "newsArchivePage",
        "newsArticlePage",
    };

    private readonly IConfiguration _config;
    private readonly IPublishedUrlProvider _urlProvider;
    private readonly IContentService _contentService;

    public InfoPortalPreviewService(
        IConfiguration config,
        IPublishedUrlProvider urlProvider,
        IContentService contentService)
    {
        _config = config;
        _urlProvider = urlProvider;
        _contentService = contentService;
    }

    public Task<DocumentPreviewUrlInfo> PreviewUrlInfoAsync(IContent content, string? culture, string? segment)
    {
        var alias = content.ContentType.Alias;
        if (!PageContentTypes.Contains(alias))
        {
            return Task.FromResult(new DocumentPreviewUrlInfo
            {
                Info = $"Forhåndsvisning er ikke tilgjengelig for innholdstypen '{alias}'."
            });
        }

        var frontendUrl = (_config["HeadlessPreview:FrontendUrl"] ?? "http://localhost:4321").TrimEnd('/');
        var previewSecret = _config["HeadlessPreview:PreviewSecret"] ?? string.Empty;

        var path = ResolvePath(content, culture);
        if (string.IsNullOrEmpty(path))
        {
            return Task.FromResult(new DocumentPreviewUrlInfo
            {
                Info = $"Kunne ikke generere forhåndsvisnings-URL for '{content.Name}'."
            });
        }

        if (string.IsNullOrEmpty(previewSecret))
        {
            return Task.FromResult(new DocumentPreviewUrlInfo
            {
                Info = "Forhåndsvisning er ikke konfigurert (HeadlessPreview:PreviewSecret mangler)."
            });
        }

        var exp = DateTimeOffset.UtcNow.AddMinutes(PreviewLinkLifetimeMinutes).ToUnixTimeSeconds();
        var sig = SignPath(previewSecret, path, exp);
        var previewUrl = $"{frontendUrl}{path}?preview=1&exp={exp}&sig={sig}";
        return Task.FromResult(new DocumentPreviewUrlInfo { PreviewUrl = previewUrl });
    }

    private static string SignPath(string secret, string path, long exp)
    {
        var payload = System.Text.Encoding.UTF8.GetBytes($"{path}|{exp}");
        using var hmac = new System.Security.Cryptography.HMACSHA256(System.Text.Encoding.UTF8.GetBytes(secret));
        var hash = hmac.ComputeHash(payload);
        return Convert.ToBase64String(hash).TrimEnd('=').Replace('+', '-').Replace('/', '_');
    }

    private string? ResolvePath(IContent content, string? culture)
    {
        // Published content: trust Umbraco's URL provider, which handles culture/domain prefixes.
        var providerUrl = _urlProvider.GetUrl(content.Id, UrlMode.Relative, culture);
        if (!string.IsNullOrWhiteSpace(providerUrl) && providerUrl != "#")
        {
            return providerUrl;
        }

        // Unpublished draft: walk ancestors to construct a path manually.
        var segments = new List<string>();
        var current = content;
        while (current is not null)
        {
            if (string.Equals(current.ContentType.Alias, "startPage", StringComparison.OrdinalIgnoreCase))
            {
                break;
            }
            var seg = GetUrlSegment(current, culture);
            if (string.IsNullOrWhiteSpace(seg))
            {
                return null;
            }
            segments.Insert(0, seg);
            current = current.ParentId > 0 ? _contentService.GetById(current.ParentId) : null;
        }

        var culturePrefix = culture switch
        {
            "en" or "en-US" or "en-GB" => "/en",
            "nn" or "nn-NO" => "/nn",
            _ => string.Empty,
        };

        return segments.Count == 0
            ? $"{culturePrefix}/"
            : $"{culturePrefix}/{string.Join("/", segments)}/";
    }

    private static string GetUrlSegment(IContent content, string? culture)
    {
        var urlName = content.GetValue<string>("umbracoUrlName", culture)
                      ?? content.GetValue<string>("umbracoUrlName");
        if (!string.IsNullOrWhiteSpace(urlName))
        {
            return urlName.Trim().ToLowerInvariant();
        }

        var name = !string.IsNullOrWhiteSpace(culture) ? content.GetCultureName(culture) : content.Name;
        return Slugify(name ?? string.Empty);
    }

    private static string Slugify(string input)
    {
        var sb = new System.Text.StringBuilder(input.Length);
        var lastWasDash = true;
        foreach (var c in input.Trim().ToLowerInvariant())
        {
            if (char.IsLetterOrDigit(c))
            {
                sb.Append(c);
                lastWasDash = false;
            }
            else if (!lastWasDash)
            {
                sb.Append('-');
                lastWasDash = true;
            }
        }
        return sb.ToString().Trim('-');
    }
}
