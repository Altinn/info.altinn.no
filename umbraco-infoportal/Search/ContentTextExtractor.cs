using System.Net;
using System.Text.Json;
using System.Text.RegularExpressions;
using Infoportal.Adapters.Elasticsearch;
using Infoportal.Adapters.Elasticsearch.Models;
using Microsoft.Extensions.Options;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Web;

namespace umbraco_infoportal.Search;

public class ContentTextExtractor
{
    private readonly IContentTypeService _contentTypeService;
    private readonly IDataTypeService _dataTypeService;
    private readonly IUmbracoContextFactory _umbracoContextFactory;
    private readonly ElasticsearchOptions _options;
    private readonly ILogger<ContentTextExtractor> _logger;
    private readonly Dictionary<Guid, string?> _editorAliasCache = new();
    private static readonly Regex HtmlTagRegex = new(@"<[^>]+>", RegexOptions.Compiled);
    private static readonly Regex WhitespaceRegex = new(@"\s+", RegexOptions.Compiled);
    private static readonly Regex RteBlockRegex = new(
        @"<umb-rte-block data-content-key=""(?<guid>[0-9a-fA-F]{8}(?:-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12})""></umb-rte-block>",
        RegexOptions.Compiled);

    // Content types to index. Add new page types here as they are created.
    // TODO: Add helpQuestionPage, etc. when those content types exist.
    // TODO: Consider moving this to a backoffice setting or a "hideFromSearch" composition
    // property so admins can control which pages are indexed without code changes.
    private static readonly HashSet<string> IndexableContentTypes =
    [
        "sectionArticlePage",
        "schemaPage"
    ];

    private static readonly HashSet<string> TextEditors =
    [
        "Umbraco.TextBox",
        "Umbraco.TextArea"
    ];

    public ContentTextExtractor(
        IContentTypeService contentTypeService,
        IDataTypeService dataTypeService,
        IUmbracoContextFactory umbracoContextFactory,
        IOptions<ElasticsearchOptions> options,
        ILogger<ContentTextExtractor> logger)
    {
        _contentTypeService = contentTypeService;
        _dataTypeService = dataTypeService;
        _umbracoContextFactory = umbracoContextFactory;
        _options = options.Value;
        _logger = logger;
    }

    public SearchDocument? ExtractDocument(IContent content, string culture)
    {
        if (content.Trashed)
            return null;

        var contentType = _contentTypeService.Get(content.ContentType.Id);
        if (contentType == null)
            return null;

        if (!IndexableContentTypes.Contains(content.ContentType.Alias))
            return null;

        var textSegments = new List<string>();
        string ingress = "";

        foreach (var propertyType in contentType.PropertyTypes)
        {
            if (_options.ExcludedProperties.Contains(propertyType.Alias))
                continue;

            var editorAlias = GetEditorAlias(propertyType);
            if (editorAlias == null)
                continue;

            var value = GetPropertyValue(content, propertyType, culture);
            if (value == null)
                continue;

            var text = ExtractTextFromValue(value, editorAlias);
            if (string.IsNullOrWhiteSpace(text))
                continue;

            textSegments.Add(text);

            if (propertyType.Alias == "mainIntro" && string.IsNullOrEmpty(ingress))
                ingress = text;
        }

        var title = content.GetCultureName(culture)
            ?? content.Name
            ?? "";

        var url = GetContentUrl(content, culture) ?? "";

        return new SearchDocument
        {
            Id = $"{content.Id}_{culture}",
            ContentId = content.Id,
            ContentGuid = content.Key,
            Title = title,
            TitleSuggest = string.IsNullOrWhiteSpace(title) ? [] : [title],
            Ingress = ingress,
            Body = string.Join(" ", textSegments),
            Url = url,
            ContentType = content.ContentType.Alias,
            Culture = culture,
            PublishDate = content.PublishDate,
            UpdateDate = content.UpdateDate
        };
    }

    private string? GetEditorAlias(IPropertyType propertyType)
    {
        if (_editorAliasCache.TryGetValue(propertyType.DataTypeKey, out var cached))
            return cached;

        var dataType = _dataTypeService.GetAsync(propertyType.DataTypeKey).GetAwaiter().GetResult();
        var alias = dataType?.EditorAlias;
        _editorAliasCache[propertyType.DataTypeKey] = alias;
        return alias;
    }

    private static object? GetPropertyValue(IContent content, IPropertyType propertyType, string culture)
    {
        var isCultureVariant = propertyType.Variations.HasFlag(ContentVariation.Culture);
        return isCultureVariant
            ? content.GetValue(propertyType.Alias, culture)
            : content.GetValue(propertyType.Alias);
    }

    private string ExtractTextFromValue(object value, string editorAlias)
    {
        if (TextEditors.Contains(editorAlias))
            return value.ToString() ?? "";

        if (editorAlias == "Umbraco.RichText")
            return ExtractRichText(value.ToString());

        if (editorAlias is "Umbraco.BlockList" or "Umbraco.BlockGrid")
            return ExtractBlockListText(value.ToString());

        return "";
    }

    private string ExtractRichText(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return "";

        try
        {
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            var markup = root.TryGetProperty("markup", out var markupElement)
                ? markupElement.GetString() ?? ""
                : "";

            // Expand inline blocks referenced in the markup
            markup = RteBlockRegex.Replace(markup, match =>
            {
                if (Guid.TryParse(match.Groups["guid"].Value, out var blockGuid)
                    && root.TryGetProperty("blocks", out var blocks)
                    && blocks.TryGetProperty("contentData", out var contentData))
                {
                    return ExtractBlockContentByGuid(contentData, blockGuid);
                }
                return "";
            });

            return StripHtml(markup);
        }
        catch (JsonException ex)
        {
            _logger.LogWarning(ex, "Failed to parse RichText JSON");
            return StripHtml(json ?? "");
        }
    }

    private string ExtractBlockContentByGuid(JsonElement contentData, Guid blockGuid)
    {
        if (contentData.ValueKind != JsonValueKind.Array)
            return "";

        foreach (var block in contentData.EnumerateArray())
        {
            if (block.TryGetProperty("key", out var keyProp)
                && Guid.TryParse(keyProp.GetString(), out var key)
                && key == blockGuid
                && block.TryGetProperty("values", out var values))
            {
                return ExtractTextFromBlockValues(values);
            }
        }

        return "";
    }

    private string ExtractTextFromBlockValues(JsonElement values)
    {
        var segments = new List<string>();

        if (values.ValueKind == JsonValueKind.Array)
        {
            foreach (var val in values.EnumerateArray())
            {
                if (val.TryGetProperty("value", out var valueProp))
                {
                    var text = valueProp.ValueKind == JsonValueKind.String
                        ? StripHtml(valueProp.GetString() ?? "")
                        : "";
                    if (!string.IsNullOrWhiteSpace(text))
                        segments.Add(text);
                }
            }
        }

        return string.Join(" ", segments);
    }

    private string ExtractBlockListText(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return "";

        try
        {
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            if (root.TryGetProperty("contentData", out var contentData)
                && contentData.ValueKind == JsonValueKind.Array)
            {
                var segments = new List<string>();
                foreach (var block in contentData.EnumerateArray())
                {
                    if (block.TryGetProperty("values", out var values))
                    {
                        var text = ExtractTextFromBlockValues(values);
                        if (!string.IsNullOrWhiteSpace(text))
                            segments.Add(text);
                    }
                }
                return string.Join(" ", segments);
            }

            return "";
        }
        catch (JsonException ex)
        {
            _logger.LogWarning(ex, "Failed to parse BlockList JSON");
            return "";
        }
    }


    private string? GetContentUrl(IContent content, string culture)
    {
        try
        {
            using var ctx = _umbracoContextFactory.EnsureUmbracoContext();
            var published = ctx.UmbracoContext.Content?.GetById(content.Id);
            if (published != null)
            {
                return published.Url(culture, Umbraco.Cms.Core.Models.PublishedContent.UrlMode.Relative);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to resolve URL for content {ContentId}", content.Id);
        }

        return null;
    }

    private static string StripHtml(string html)
    {
        if (string.IsNullOrWhiteSpace(html))
            return "";

        var text = HtmlTagRegex.Replace(html, " ");
        text = WebUtility.HtmlDecode(text);
        text = WhitespaceRegex.Replace(text, " ").Trim();
        return text;
    }
}
