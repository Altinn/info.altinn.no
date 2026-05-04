using System.Text.Json.Nodes;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.PropertyEditors;
using Umbraco.Cms.Core.PublishedCache;
using Umbraco.Cms.Core.Serialization;
using Umbraco.Cms.Core.Models.Blocks;
using System.Text.RegularExpressions;
using System.Text.Json;
using uSync.Core.Extensions;

// Injecting the IPublishedContentCache for fetching content from the Umbraco cache
public class RichTextPropertyConverter : IPropertyValueConverter
{
    private readonly IJsonSerializer _json;
    private readonly ILogger<RichTextPropertyConverter> _logger;

    private readonly IPublishedContentCache _publishedContentCache;

    public RichTextPropertyConverter(IJsonSerializer json, ILogger<RichTextPropertyConverter> logger, IPublishedContentCache publishedContentCache)
    {
        _json = json;
        _logger = logger;
        _publishedContentCache = publishedContentCache;
    }

    // Make sure the Property Value Converter only applies to the RichText property editor
    public bool IsConverter(IPublishedPropertyType propertyType)
        => propertyType.EditorAlias.Equals(Constants.PropertyEditors.Aliases.RichText);


    // We consider the value to be a value only when we have the actual IPublishedContent object,
    // meaning that there is a valid picked content item.
    public bool? IsValue(object? value, PropertyValueLevel level)
    {
        return level switch
        {
            PropertyValueLevel.Source => null,
            PropertyValueLevel.Inter => null,
            PropertyValueLevel.Object => value is JsonObject,
            _ => throw new ArgumentOutOfRangeException(nameof(level), level, $"Invalid level: {level}.")
        };
    }

    // The type returned by this converter is IPublishedContent
    // And the Models Builder will take care of returning the actual generated type
    public Type GetPropertyValueType(IPublishedPropertyType propertyType)
        => typeof(JsonObject);

    // Because we have a reference to another content item, we need to use the Elements cache level,
    // to make sure that changes to the referenced item are detected and the cache invalidated accordingly.
    public PropertyCacheLevel GetPropertyCacheLevel(IPublishedPropertyType propertyType)
        => PropertyCacheLevel.Elements;

    // Converts the source value (string) to an intermediate value (GuidUdi)
    public object? ConvertSourceToIntermediate(IPublishedElement owner, IPublishedPropertyType propertyType, 
        object? source, bool preview)
    {
        return source;
    }

    // Converts the intermediate value (GuidUdi) to the actual object value (IPublishedContent)
    public object? ConvertIntermediateToObject(IPublishedElement owner, IPublishedPropertyType propertyType,
        PropertyCacheLevel referenceCacheLevel, object? inter, bool preview)
    {
        if (inter != null)
        {
            string raw = inter.ToString() ?? string.Empty;
            if (string.IsNullOrEmpty(raw))
            {
                return null;
            }
            RichTextEditorValue? rteValue = JsonSerializer.Deserialize<RichTextEditorValue>(raw);

            if (rteValue is null || rteValue.Markup is null)
            {
                return null;
            }
            return new JsonObject { { "items", ParseRichText(rteValue) } };
        }
        else
        {
            return null;
        }
    }

    private JsonArray ParseRichText(RichTextEditorValue rteValue)
    {
        string pattern = @"<umb-rte-block data-content-key=""(?<contentguid>[0-9a-fA-F]{8}(?:-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12})""></umb-rte-block>";
        JsonArray items = [];
        string markup = rteValue.Markup;
        Match match = Regex.Match(markup, pattern);

        while (match.Success)
        {
            string before = markup[0..match.Index];
            if (!IsEmptyHtml(before))
            {
                items.Add(new JsonObject
                {
                    { "html", before },
                    { "componentName", "RichText" }
                });
            }

            Guid blockGuid = Guid.Parse(match.Groups["contentguid"].Value);
            items.Add(ConvertBlock(blockGuid, rteValue));

            if (markup.Length > match.Length)
            {
                markup = markup[(match.Index + match.Length)..];
            } else
            {
                markup = "";
            }

            match = Regex.Match(markup, pattern);
        }

        if (!IsEmptyHtml(markup))
        {
            items.Add(new JsonObject
            {
                { "html", markup },
                { "componentName", "RichText" }
            });
        }
        return items;
    }

    private static bool IsEmptyHtml(string? html)
    {
        if (string.IsNullOrWhiteSpace(html)) return true;
        if (Regex.IsMatch(html, "<(img|iframe|video|audio|svg|picture)\\b", RegexOptions.IgnoreCase))
        {
            return false;
        }
        string stripped = Regex.Replace(html, "<[^>]+>", string.Empty);
        stripped = stripped.Replace("&nbsp;", " ").Replace("&#160;", " ");
        return string.IsNullOrWhiteSpace(stripped);
    }

    private JsonObject ConvertBlock(Guid guid, RichTextEditorValue rteValue)
    {
        RichTextBlockValue? rteBlockValue = rteValue.Blocks;
        if (rteBlockValue is null)
        {
            return new JsonObject();
        }
        foreach (BlockItemData blockItemData in rteBlockValue.ContentData)
        {
            if (blockItemData.Key == guid)
            {
                JsonObject item = new JsonObject();
                string pickerName = blockItemData.Values[0].Alias;
                string blockName = Capitalize(pickerName.Replace("Picker", ""));
                item.Add("componentName", blockName);

                string? uriString = blockItemData.Values[0].Value?.ToString();
                if (string.IsNullOrEmpty(uriString))
                {
                    return item;
                }
                Uri uri = new Uri(uriString);

                IPublishedContent? content = _publishedContentCache.GetById(new GuidUdi(uri).Guid);

                if (content != null)
                {
                    foreach (IPublishedProperty property in content.Properties)
                    {
                        object? value = property.GetDeliveryApiValue(true);
                        if (value is null)
                        {
                            continue;
                        }

                        if (value is bool v) {
                            item.Add(property.Alias, v);
                        } else {
                            item.Add(property.Alias, value.ConvertToJsonNode());
                        }
                    }
                }
                return item;
            }
        }
        return new JsonObject();
    }

    private string Capitalize(string value)
    {
        return char.ToUpper(value[0]) + value[1..];
    }
}

