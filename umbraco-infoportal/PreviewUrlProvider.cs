using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Routing;
using Microsoft.Extensions.Configuration;

public class PreviewUrlProvider : IUrlProvider
{
    private readonly IConfiguration _configuration;
    
    public PreviewUrlProvider(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string Alias => "PreviewUrlProvider";

    public UrlInfo? GetUrl(IPublishedContent content, UrlMode mode, string? culture, Uri current)
        => null;

    public IEnumerable<UrlInfo> GetOtherUrls(int id, Uri current)
        => [];

    public async Task<UrlInfo?> GetPreviewUrlAsync(IContent content, string? culture, string? segment)
    {
        string? siteBaseUrl = _configuration["Umbraco:CMS:WebRouting:UmbracoApplicationUrl"];
        
        // The precise content update time is not exposed to the outside world and serve as a secret
        // It also makes sure that the same preview url can not be used for future versions of the content
        DateTime contentUpdateDateTime = content.CultureInfos[culture].Date;
        string? secret = new DateTimeOffset(contentUpdateDateTime).ToUnixTimeMilliseconds().ToString();

        return new UrlInfo(
                url: new Uri($"{siteBaseUrl}/preview?id={content.Key}&locale={culture}&secret={secret}"),
                provider: Alias,
                culture: culture,
                message: null,
                isExternal: true);
    }
}