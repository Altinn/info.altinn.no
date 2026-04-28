using System.Text.Json.Nodes;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.PropertyEditors;
using Umbraco.Cms.Core.PublishedCache;
using Umbraco.Cms.Core.Serialization;
using uSync.Core.Extensions;


// Injecting the IPublishedContentCache for fetching content from the Umbraco cache
public class ContentPickerPropertyConverter : IPropertyValueConverter
{
    private readonly IJsonSerializer _json;
    private readonly ILogger<ContentPickerPropertyConverter> _logger;

    private readonly IPublishedContentCache _publishedContentCache;

    public ContentPickerPropertyConverter(IJsonSerializer json, ILogger<ContentPickerPropertyConverter> logger, IPublishedContentCache publishedContentCache)
    {
        _json = json;
        _logger = logger;
        _publishedContentCache = publishedContentCache;
    }

    // Make sure the Property Value Converter only applies to the Content Picker property editor
    public bool IsConverter(IPublishedPropertyType propertyType)
        => propertyType.EditorAlias.Equals(Constants.PropertyEditors.Aliases.MultiNodeTreePicker) 
        && "accordianList".Equals(propertyType.Alias);


    public bool? IsValue(object? value, PropertyValueLevel level)
    {
        return level switch
        {
            PropertyValueLevel.Source => null,
            PropertyValueLevel.Inter => null,
            PropertyValueLevel.Object => value is JsonArray,
            _ => throw new ArgumentOutOfRangeException(nameof(level), level, $"Invalid level: {level}.")
        };
    }

    public Type GetPropertyValueType(IPublishedPropertyType propertyType)
        => typeof(JsonArray);

    public PropertyCacheLevel GetPropertyCacheLevel(IPublishedPropertyType propertyType)
        => PropertyCacheLevel.Elements;

    public object? ConvertSourceToIntermediate(IPublishedElement owner, IPublishedPropertyType propertyType, 
        object? source, bool preview)
    {
        return source;
    }

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
            string[] uriStrings = raw.Split(",");
            JsonArray items = [];


            foreach (string uriString in uriStrings)
            {
                IPublishedContent? content = _publishedContentCache.GetById(new GuidUdi(new Uri(uriString)).Guid);
                if (content != null)
                {
                    JsonObject item = new JsonObject()
                    {
                        { "contentType", content.ContentType.Alias},
                        { "name", content.Name }
                    };

                    foreach (IPublishedProperty property in content.Properties)
                    {
                        object? value = property.GetDeliveryApiValue(true);
                        if (value is null)
                        {
                            continue;
                        }
                        item.Add(property.Alias, value.ConvertToJsonNode());
                    }
                    items.Add(item);
                }
            }

            //return new JsonObject{{"items", items}};
            return items;
        }
        else
        {
            return null;
        }
    }
}

