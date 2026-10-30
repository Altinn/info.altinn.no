using System.Net;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Options;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.PublishedCache;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Web;
using Infoportal.Cms.Search.Models;

namespace Infoportal.Cms.Search.Services;

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

    private const string HelpSectionsAlias = "helpSections";
    private const string SectionHeadingAlias = "heading";
    private const string SectionMainBodyAlias = "mainBody";
    private const string SectionAccordionListAlias = "accordionList";
    private const string AccordionContentAlias = "content";

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
        if (content.Trashed || !IsIndexable(content.ContentType.Alias))
            return [];

        var contentType = _contentTypeService.Get(content.ContentType.Id);
        if (contentType == null)
            return [];

        var url = GetContentUrl(content, culture) ?? "";

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

            // Help sections are indexed as their own documents (linking to the section anchor),
            // so they are kept out of the page body to avoid the same text matching twice.
            if (propertyType.Alias == HelpSectionsAlias)
            {
                documents.AddRange(ExtractSectionDocuments(content, culture, url, value.ToString()));
                continue;
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

        var page = CreateDocument(content, culture, $"{content.Id}_{culture}", title, url);
        page.Ingress = ingress;
        page.Body = string.Join(" ", textSegments);
        page.MetaTitle = metaTitle;
        page.MetaDescription = metaDescription;
        page.MetaKeywords = metaKeywords;
        documents.Add(page);

        return documents;
    }

    private static SearchDocument CreateDocument(IContent content, string culture, string id, string title, string url)
    {
        var bet = BestBetData.FindByTitle(title);

        return new SearchDocument
        {
            Id = id,
            ContentId = content.Id,
            ContentGuid = content.Key,
            Title = title,
            TitleSuggest = string.IsNullOrWhiteSpace(title) ? [] : [title],
            Url = url,
            ContentType = content.ContentType.Alias,
            Culture = culture,
            PublishDate = content.PublishDate,
            UpdateDate = content.UpdateDate,
            BestBetTriggers = bet?.TriggerPhrases.ToArray() ?? []
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
            return ExtractRichText(doc.RootElement);
        }
        catch (JsonException ex)
        {
            _logger.LogWarning(ex, "Failed to parse RichText JSON");
            return StripHtml(json);
        }
    }

    private string ExtractRichText(JsonElement root)
    {
        if (root.ValueKind != JsonValueKind.Object)
            return "";

        var markup = root.TryGetProperty("markup", out var markupElement)
            && markupElement.ValueKind == JsonValueKind.String
                ? markupElement.GetString() ?? ""
                : "";

        // Expand inline blocks referenced in the markup
        markup = RteBlockRegex.Replace(markup, match =>
        {
            if (Guid.TryParse(match.Groups["guid"].Value, out var blockGuid)
                && root.TryGetProperty("blocks", out var blocks)
                && blocks.ValueKind == JsonValueKind.Object
                && blocks.TryGetProperty("contentData", out var contentData))
            {
                return ExtractBlockContentByGuid(contentData, blockGuid);
            }
            return "";
        });

        return StripHtml(markup);
    }

    private static string ExtractBlockContentByGuid(JsonElement contentData, Guid blockGuid)
    {
        if (contentData.ValueKind != JsonValueKind.Array)
            return "";

        foreach (var block in contentData.EnumerateArray())
        {
            if (TryGetBlockKey(block, out var key)
                && key == blockGuid
                && block.TryGetProperty("values", out var values))
            {
                return ExtractTextFromBlockValues(values);
            }
        }

        return "";
    }

    private static string ExtractTextFromBlockValues(JsonElement values)
    {
        var segments = new List<string>();

        if (values.ValueKind == JsonValueKind.Array)
        {
            foreach (var val in values.EnumerateArray())
            {
                if (val.ValueKind == JsonValueKind.Object
                    && val.TryGetProperty("value", out var valueProp)
                    && valueProp.ValueKind == JsonValueKind.String)
                {
                    var text = StripHtml(valueProp.GetString());
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

            if (root.ValueKind != JsonValueKind.Object
                || !root.TryGetProperty("contentData", out var contentData)
                || contentData.ValueKind != JsonValueKind.Array)
                return "";

            var segments = new List<string>();
            foreach (var block in contentData.EnumerateArray())
            {
                if (block.ValueKind == JsonValueKind.Object && block.TryGetProperty("values", out var values))
                {
                    var text = ExtractTextFromBlockValues(values);
                    if (!string.IsNullOrWhiteSpace(text))
                        segments.Add(text);
                }
            }
            return string.Join(" ", segments);
        }
        catch (JsonException ex)
        {
            _logger.LogWarning(ex, "Failed to parse BlockList JSON");
            return "";
        }
    }

    private List<SearchDocument> ExtractSectionDocuments(IContent content, string culture, string pageUrl, string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return [];

        try
        {
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            if (root.ValueKind != JsonValueKind.Object
                || !root.TryGetProperty("contentData", out var contentData)
                || contentData.ValueKind != JsonValueKind.Array)
                return [];

            var sectionDocuments = new List<SearchDocument>();
            // Mirrors HelpPageTransformer.ts: every section claims an anchor in order,
            // including ones skipped here, so duplicate headings get the same "-2" suffix.
            var usedAnchors = new HashSet<string>();

            foreach (var section in contentData.EnumerateArray())
            {
                if (section.ValueKind != JsonValueKind.Object)
                    continue;

                var heading = GetBlockString(section, SectionHeadingAlias, culture);
                var anchor = MakeUniqueSlug(Slugify(heading ?? ""), usedAnchors);

                if (string.IsNullOrWhiteSpace(heading) || !TryGetBlockKey(section, out var sectionKey))
                    continue;

                var document = CreateDocument(
                    content,
                    culture,
                    $"{content.Id}_{culture}_{sectionKey}",
                    heading,
                    string.IsNullOrEmpty(pageUrl) ? "" : $"{pageUrl}#{anchor}");
                document.Ingress = ExtractSectionMainBody(section, culture);
                document.Body = ExtractSectionAccordions(section, culture);
                sectionDocuments.Add(document);
            }

            return sectionDocuments;
        }
        catch (JsonException ex)
        {
            _logger.LogWarning(ex, "Failed to parse helpSections JSON for content {ContentId}", content.Id);
            return [];
        }
    }

    private string ExtractSectionMainBody(JsonElement section, string culture)
    {
        // The rich text value is either an object or a JSON-encoded string, depending on how it was saved
        return GetBlockValue(section, SectionMainBodyAlias, culture) switch
        {
            { ValueKind: JsonValueKind.Object } value => ExtractRichText(value),
            { ValueKind: JsonValueKind.String } value => ExtractRichText(value.GetString()),
            _ => ""
        };
    }

    private string ExtractSectionAccordions(JsonElement section, string culture)
    {
        var accordionList = GetBlockValue(section, SectionAccordionListAlias, culture);
        if (accordionList == null)
            return "";

        var segments = new List<string>();
        foreach (var key in ReadStringArray(accordionList.Value))
        {
            if (!Guid.TryParse(key, out var elementKey))
            {
                _logger.LogWarning("Skipping accordion with invalid key {Key}", key);
                continue;
            }

            var text = ExtractElementTextByGuid(elementKey, culture);
            if (!string.IsNullOrWhiteSpace(text))
                segments.Add(text);
        }

        return string.Join(" ", segments);
    }

    private string ExtractElementTextByGuid(Guid key, string culture)
    {
        var element = _publishedElementCache.GetById(false, key);
        if (element == null)
            return "";

        var segments = new List<string>();

        var name = element.Name(culture);
        if (!string.IsNullOrWhiteSpace(name))
            segments.Add(name);

        var contentText = ExtractElementHtml(element.GetProperty(AccordionContentAlias)?.GetValue(culture)?.ToString());
        if (!string.IsNullOrWhiteSpace(contentText))
            segments.Add(contentText);

        return string.Join(" ", segments);
    }

    // The accordion content value is JSON shaped like { "items": [{ "html": "..." }] }
    private string ExtractElementHtml(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return "";

        try
        {
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            if (root.ValueKind == JsonValueKind.Object
                && root.TryGetProperty("items", out var items)
                && items.ValueKind == JsonValueKind.Array
                && items.GetArrayLength() > 0
                && items[0].ValueKind == JsonValueKind.Object
                && items[0].TryGetProperty("html", out var html)
                && html.ValueKind == JsonValueKind.String)
            {
                return StripHtml(html.GetString());
            }

            return "";
        }
        catch (JsonException ex)
        {
            _logger.LogWarning(ex, "Failed to parse accordion content JSON");
            return StripHtml(json);
        }
    }

    // Block values are stored as [{ "alias", "culture", "value" }]. Prefers the entry for the
    // requested culture and falls back to the invariant one (culture: null).
    private static JsonElement? GetBlockValue(JsonElement block, string alias, string culture)
    {
        if (!block.TryGetProperty("values", out var values) || values.ValueKind != JsonValueKind.Array)
            return null;

        JsonElement? invariant = null;
        foreach (var entry in values.EnumerateArray())
        {
            if (entry.ValueKind != JsonValueKind.Object
                || !entry.TryGetProperty("alias", out var aliasProp)
                || aliasProp.ValueKind != JsonValueKind.String
                || !aliasProp.ValueEquals(alias)
                || !entry.TryGetProperty("value", out var value))
                continue;

            var entryCulture = entry.TryGetProperty("culture", out var cultureProp)
                && cultureProp.ValueKind == JsonValueKind.String
                    ? cultureProp.GetString()
                    : null;

            if (entryCulture == culture)
                return value;

            if (entryCulture == null)
                invariant ??= value;
        }

        return invariant;
    }

    private static string? GetBlockString(JsonElement block, string alias, string culture) =>
        GetBlockValue(block, alias, culture) is { ValueKind: JsonValueKind.String } value
            ? value.GetString()
            : null;

    private static bool TryGetBlockKey(JsonElement block, out Guid key)
    {
        key = Guid.Empty;
        return block.ValueKind == JsonValueKind.Object
            && block.TryGetProperty("key", out var keyProp)
            && keyProp.ValueKind == JsonValueKind.String
            && Guid.TryParse(keyProp.GetString(), out key);
    }

    // Accepts a JSON array of strings, or a string containing one.
    private static List<string> ReadStringArray(JsonElement value)
    {
        if (value.ValueKind == JsonValueKind.String)
        {
            var raw = value.GetString();
            if (string.IsNullOrWhiteSpace(raw))
                return [];

            try
            {
                using var doc = JsonDocument.Parse(raw);
                return ReadStringArray(doc.RootElement);
            }
            catch (JsonException)
            {
                return [];
            }
        }

        if (value.ValueKind != JsonValueKind.Array)
            return [];

        return value.EnumerateArray()
            .Where(item => item.ValueKind == JsonValueKind.String)
            .Select(item => item.GetString()!)
            .ToList();
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

    // Keep in sync with slugify() in astro-infoportal/src/Components/Shared/RichText/htmlTransforms.ts,
    // which generates the section anchor ids on the page.
    private static string Slugify(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            return "section";

        var normalized = name
            .Normalize(NormalizationForm.FormC)
            .ToLowerInvariant();

        var result = new StringBuilder();
        bool lastDash = false;

        foreach (char ch in normalized)
        {
            // Matches the JS /[\p{L}\p{N}]/ test
            if (char.IsLetter(ch) || char.IsNumber(ch))
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

    // Keep in sync with makeUniqueSlug() in htmlTransforms.ts
    private static string MakeUniqueSlug(string baseSlug, HashSet<string> used)
    {
        var slug = baseSlug;
        var i = 2;
        while (!used.Add(slug))
        {
            slug = $"{baseSlug}-{i++}";
        }
        return slug;
    }

    private static string StripHtml(string? html)
    {
        if (string.IsNullOrWhiteSpace(html))
            return "";

        var text = HtmlTagRegex.Replace(html, " ");
        text = WebUtility.HtmlDecode(text);
        text = WhitespaceRegex.Replace(text, " ").Trim();
        return text;
    }
}
