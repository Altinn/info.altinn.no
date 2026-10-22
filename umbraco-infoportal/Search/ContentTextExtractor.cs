using System.Net;
using System.Text.Json;
using System.Text.RegularExpressions;
using Infoportal.Adapters.Elasticsearch;
using Infoportal.Adapters.Elasticsearch.Models;
using Microsoft.Extensions.Options;
using umbraco_infoportal.Search.BestBets;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.PublishedCache;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Web;
using Json.Path;
using System.Text.Json.Nodes;
using Json.More;
using System.Text;

namespace umbraco_infoportal.Search;

public class ContentTextExtractor
{
    private readonly IContentTypeService _contentTypeService;
    private readonly IDataTypeService _dataTypeService;
    private readonly IUmbracoContextFactory _umbracoContextFactory;

    private readonly IPublishedElementCache _publishedElementCache;

    private readonly ElasticsearchOptions _options;
    private readonly ILogger<ContentTextExtractor> _logger;
    private readonly Dictionary<Guid, string?> _editorAliasCache = new();
    private static readonly Regex HtmlTagRegex = new(@"<[^>]+>", RegexOptions.Compiled);
    private static readonly Regex WhitespaceRegex = new(@"\s+", RegexOptions.Compiled);
    private static readonly Regex RteBlockRegex = new(
        @"<umb-rte-block data-content-key=""(?<guid>[0-9a-fA-F]{8}(?:-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12})""></umb-rte-block>",
        RegexOptions.Compiled);

    // Content types to index. Aliases for content types that do not yet exist in Umbraco
    // are harmless: publish events only fire for types that exist, so unmatched entries are ignored.
    // Keep aligned with SearchContextMapping so every indexed type has a filter context.
    // TODO: Consider moving this to a backoffice setting or a "hideFromSearch" composition
    // property so admins can control which pages are indexed without code changes.
    private static readonly HashSet<string> IndexableContentTypes =
    [
        "sectionArticlePage",
        "sectionPage",
        "subsidyPage",
        "schemaPage",
        "schemaCollectionPage",
        "schemaAttachmentPage",
        "helpQuestionPage",
        "helpProcessArticlePage",
        "newsArticlePage",
        "articlePage",
        "themePage",
        "helpPage"
    ];

    private static readonly HashSet<string> TextEditors =
    [
        "Umbraco.TextBox",
        "Umbraco.TextArea"
    ];

    public static bool IsIndexable(string contentTypeAlias) =>
        IndexableContentTypes.Contains(contentTypeAlias);

    public ContentTextExtractor(
        IContentTypeService contentTypeService,
        IDataTypeService dataTypeService,
        IPublishedElementCache publishedElementCache,
        IUmbracoContextFactory umbracoContextFactory,
        IOptions<ElasticsearchOptions> options,
        ILogger<ContentTextExtractor> logger)
    {
        _contentTypeService = contentTypeService;
        _dataTypeService = dataTypeService;
        _publishedElementCache = publishedElementCache;
        _umbracoContextFactory = umbracoContextFactory;
        _options = options.Value;
        _logger = logger;
    }

    public List<SearchDocument> ExtractDocuments(IContent content, string culture)
    {
        if (content.Trashed)
            return [];

        var contentType = _contentTypeService.Get(content.ContentType.Id);
        if (contentType == null)
            return [];

        if (!IndexableContentTypes.Contains(content.ContentType.Alias))
            return [];

        var textSegments = new List<string>();
        string ingress = "";
        string metaTitle = "";
        string metaDescription = "";
        string metaKeywords = "";

        var documents = new List<SearchDocument>();

        // Use CompositionPropertyTypes (not PropertyTypes) so we also iterate properties
        // inherited from compositions — e.g. SEO/meta fields that live on a shared SEO composition.
        foreach (var propertyType in contentType.CompositionPropertyTypes)
        {
            if (_options.ExcludedProperties.Contains(propertyType.Alias))
            {
                // metaTitle/metaDescription/metaKeywords are excluded from `body`
                // (avoiding double-counting), but still read into dedicated fields below.
                if (propertyType.Alias is "metaTitle" or "metaDescription" or "metaKeywords")
                {
                    var metaEditorAlias = GetEditorAlias(propertyType);
                    if (metaEditorAlias == null)
                        continue;

                    var metaValue = GetPropertyValue(content, propertyType, culture);
                    if (metaValue == null)
                        continue;

                    var metaText = ExtractTextFromValue(metaValue, metaEditorAlias);
                    if (string.IsNullOrWhiteSpace(metaText))
                        continue;

                    switch (propertyType.Alias)
                    {
                        case "metaTitle": metaTitle = metaText; break;
                        case "metaDescription": metaDescription = metaText; break;
                        case "metaKeywords": metaKeywords = metaText; break;
                    }
                }
                continue;
            }

            var value = GetPropertyValue(content, propertyType, culture);
            if (value == null)
                continue;

            if (propertyType.Alias == "helpSections")
            {
                documents.AddRange(ExtractSectionDocuments(content, culture, value.ToString()));
            }

            var editorAlias = GetEditorAlias(propertyType);
            if (editorAlias == null)
                continue;

            var text = ExtractTextFromValue(value, editorAlias);
            if (string.IsNullOrWhiteSpace(text))
                continue;

            textSegments.Add(text);

            if ((propertyType.Alias == "mainIntro" || propertyType.Alias == "leadText") && string.IsNullOrEmpty(ingress))
                ingress = text;
        }

        var title = content.GetCultureName(culture)
            ?? content.Name
            ?? "";

        var url = GetContentUrl(content, culture) ?? "";
        var bet = BestBetData.FindByTitle(title);

        documents.Add(new SearchDocument
        {
            Id = $"{content.Id}_{culture}",
            ContentId = content.Id,
            ContentGuid = content.Key,
            Title = title,
            TitleSuggest = string.IsNullOrWhiteSpace(title) ? [] : [title],
            Ingress = ingress,
            Body = string.Join(" ", textSegments),
            MetaTitle = metaTitle,
            MetaDescription = metaDescription,
            MetaKeywords = metaKeywords,
            Url = url,
            ContentType = content.ContentType.Alias,
            Culture = culture,
            PublishDate = content.PublishDate,
            UpdateDate = content.UpdateDate,
            BestBetTriggers = bet?.TriggerPhrases.ToArray() ?? []
        });

        return documents;
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

    private List<SearchDocument> ExtractSectionDocuments(IContent content, string culture, string? json)
    {
        
        var sectionDocuments = new List<SearchDocument>();

        if (string.IsNullOrWhiteSpace(json))
            return [];

        try
        {
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;
            var sectionNamePath = JsonPath.Parse($"$.values[?(@.culture == '{culture}' && @.alias == 'heading')].value");
            var sectionMainBodyPath = JsonPath.Parse($"$.values[?(@.culture == '{culture}' && @.alias == 'mainBody')].value");

            var sectionAccordionListPath = JsonPath.Parse($"$.values[?@.alias == 'accordionList'].value");
            var markupPath = JsonPath.Parse("$.markup");

            if (root.TryGetProperty("contentData", out var contentData)
                && contentData.ValueKind == JsonValueKind.Array)
            {
                var segments = new List<string>();
                int index = 0;
                foreach (var sectionJson in contentData.EnumerateArray())
                {
                    string? sectionName = sectionNamePath.Evaluate(
                        JsonNode.Parse(sectionJson.ToJsonString())).Matches.FirstOrDefault()?.Value.ToString();

                    if (sectionName is null)
                    {
                        continue;
                    }

                    string? sectionMainBodyJson = sectionMainBodyPath.Evaluate(
                        JsonNode.Parse(sectionJson.ToJsonString())).Matches.FirstOrDefault()?.Value?.ToString();

                    string sectionMainBodyText = null;

                    if (sectionMainBodyJson is not null)
                    {
                        var sectionMainBodyMarkup = markupPath.Evaluate(JsonNode.Parse(sectionMainBodyJson)).Matches.FirstOrDefault()?.Value.ToString();
                        sectionMainBodyText = StripHtml(sectionMainBodyMarkup);
                    }
                    string url = GetContentUrl(content, culture) + "#" + Slugify(sectionName);

                    string? guidsJson = sectionAccordionListPath.Evaluate(JsonNode.Parse(sectionJson.ToJsonString())).Matches.FirstOrDefault()?.Value?.ToString();

                    string accordionText = "";

                    foreach (var jsonNode in JsonDocument.Parse(guidsJson).RootElement.EnumerateArray())
                    {
                        accordionText += ExtractElementTextByGuid(Guid.Parse(jsonNode.ToString()), culture) + " ";
                    }

                    var bet = BestBetData.FindByTitle(sectionName);

                    sectionDocuments.Add(new SearchDocument{
                        Id = $"{content.Id}_{culture}_{index}",
                        ContentId = content.Id,
                        ContentGuid = content.Key,
                        Title = sectionName,
                        TitleSuggest = string.IsNullOrWhiteSpace(sectionName) ? [] : [sectionName],
                        Ingress = sectionMainBodyText,
                        Body = accordionText,
                        Url = url,
                        ContentType = content.ContentType.Alias,
                        Culture = culture,
                        PublishDate = content.PublishDate,
                        UpdateDate = content.UpdateDate,
                        BestBetTriggers = bet?.TriggerPhrases.ToArray() ?? []
                    });

                    index++;
                }

                return sectionDocuments;
            }

            return [];
        }
        catch (JsonException ex)
        {
            _logger.LogWarning(ex, "Failed to parse BlockList JSON");
            return [];
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

    private string? Slugify(string name)
    {
        var normalized = name
            .Normalize(NormalizationForm.FormC)
            .ToLowerInvariant();

        var result = new StringBuilder();
        bool lastDash = false;

        foreach (char ch in normalized)
        {
            if (char.IsLetterOrDigit(ch))
            {
                result.Append(ch);
                lastDash = false;
            }
            else if (char.IsWhiteSpace(ch) || ch == '-' || ch == '_')
            {
                if (!lastDash)
                {
                    result.Append('-');
                    lastDash = true;
                }
            }
        }

        var output = result.ToString().Trim('-');

        return string.IsNullOrEmpty(output) ? "section" : output;
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

    private string ExtractElementTextByGuid(Guid guid, string culture)
    {
       
        var element = _publishedElementCache.GetById(false, guid);
        string text = element.Name(culture);

        object contentProperty = element.GetProperty("content")?.GetValue(culture);

        if (contentProperty is not null)
        {
            var elementHtmlPath = JsonPath.Parse("$.items[0].html");
            string? html = elementHtmlPath.Evaluate(
                        JsonNode.Parse(contentProperty.ToString())).Matches.FirstOrDefault()?.Value.ToString();
            text += " " + StripHtml(html);
        }


        return text;
    }
}
