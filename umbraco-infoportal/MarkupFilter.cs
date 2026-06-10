using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using System.Text.Json;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.PublishedCache;
using uSync.Core.Extensions;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Services;

public class MarkupFilter
{
    private readonly IPublishedContentCache _publishedContentCache;
    private readonly IMediaService _mediaService;

    private readonly IVariationContextAccessor _variationContextAccessor;    

    public MarkupFilter(IPublishedContentCache publishedContentCache, IMediaService mediaService, IVariationContextAccessor variationContextAccessor)
    {
        _publishedContentCache = publishedContentCache;
        _mediaService = mediaService;
        _variationContextAccessor = variationContextAccessor;
    }

    public string? FilterMarkup(string markup)
    {
        if (string.IsNullOrEmpty(markup))
        {
            return null;
        }

        markup = ReplaceImages(markup);
        markup = ReplaceInternalLinks(markup);
        markup = ReplaceLegacyLinks(markup);
        return markup;
    }


    private string ReplaceImages(string markup)
    {
        string pattern = @"<img [^>]+>";
        string resultMarkup = markup;

        foreach (Match match in Regex.Matches(markup, pattern))
        {
            string imgTag = match.Value;
            string udiString = GetUdiFromImageTag(imgTag);

            if (string.IsNullOrEmpty(udiString))
            {
                continue;
            }

            string src = GetSrcFromImageTag(imgTag);

            if (string.IsNullOrEmpty(src))
            {
                continue;
            }

            string parameters = GetUrlParams(src);
            
            GuidUdi guidUdi = (GuidUdi) UdiParser.Parse(udiString);
            string? url = ResolveMediaUrl(guidUdi.Guid);

            if (!string.IsNullOrEmpty(parameters))
            {
                url += "?" + parameters;
            }

            resultMarkup = resultMarkup.Replace($" data-udi=\"{udiString}\"", "");
            resultMarkup = resultMarkup.Replace(src, url);
        }

        return resultMarkup;
    }

    private string GetUrlParams(string url)
    {
        if (!url.Contains("?"))
        {
            return null;
        }

        return url.Substring(url.IndexOf("?"));
    }

    private string GetUdiFromImageTag(string imageTag)
    {
        string pattern = @"data-udi=""umb://media/(?<udi>[0-9a-fA-F]{32})""";

        Match match = Regex.Match(imageTag, pattern);

        if (match.Success)
        {
            return "umb://media/" + match.Groups["udi"].Value;
        }

        return null;
    }

    private string GetSrcFromImageTag(string imageTag)
    {
        string pattern = @"src=""(?<src>[^""]+)""";
        
        Match match = Regex.Match(imageTag, pattern);

        if (match.Success)
        {
            return match.Groups["src"].Value;
        }

        return null;
    }

    private string ReplaceInternalLinks(string markup)
    {
        string pattern = @"href=""/{localLink:(?<contentguid>[0-9a-fA-F]{8}(?:-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12})}""";

        string result = markup;

        foreach (Match match in Regex.Matches(markup, pattern))
        {
            string contentGUID = match.Groups["contentguid"].Value;

            Guid guid = Guid.Parse(contentGUID);
            string url = ResolveMediaUrl(guid);

            if (string.IsNullOrEmpty(url))
            {
                url = GetContentUrl(guid);
            }

            if (!string.IsNullOrEmpty(url))
            {
                result = result.Replace("/{localLink:" + contentGUID + "}", url);            
            }
        }

        return result;        
    }

    private string? ResolveMediaUrl(Guid guid)
    {
        IMedia media = _mediaService.GetById(guid);

        if (media is null)
        {
            return null;
        }

        string? umbracoFile = media.GetValue<string>("umbracoFile");

        if (string.IsNullOrEmpty(umbracoFile))
        {
            return null;
        }

        if (umbracoFile.StartsWith('{'))
        {
            JsonObject umbracoFileObject = JsonSerializer.Deserialize<JsonObject>(umbracoFile);
            return umbracoFileObject.GetPropertyAsString("src");            
        } 
        else
        {
            return umbracoFile;
        }
    }

    private string ReplaceLegacyLinks(string markup)
    {
        string pattern = @"~/link/(?<contentguid>[0-9a-fA-F]+)\.aspx";
        string result = markup;

        foreach (Match match in Regex.Matches(markup, pattern))
        {
            string contentGUIDString = match.Groups["contentguid"].Value;

            if (string.IsNullOrEmpty(contentGUIDString))
            {
                continue;
            }

            Guid guid = Guid.Parse(contentGUIDString);

            string url = GetContentUrl(guid);

            if (string.IsNullOrEmpty(url))
            {
                continue;
            }

            result = result.Replace(match.Value, url);
        }

        return result;        
    }

    private string? GetContentUrl(Guid guid)
    {
        IPublishedContent content = _publishedContentCache.GetById(guid);

        if (content is null)
        {
            return null;
        }

        string culture = _variationContextAccessor.VariationContext?.Culture;
        return content.Url(culture);
    }
}

