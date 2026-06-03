using System.Text.Json;
using System.Text.Json.Nodes;
using Markdig.Syntax;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Models.Blocks;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.PropertyEditors;
using Umbraco.Cms.Core.PublishedCache;
using Umbraco.Cms.Core.Serialization;
using uSync.Core.Extensions;
using Umbraco.Cms.Core.Models.ContentEditing;
using Umbraco.Cms.Core.Models.DeliveryApi;
using Umbraco.Cms.Core.Services;

public class BlockListPropertyConverter : IPropertyValueConverter
{
    private readonly IPublishedContentCache _publishedContentCache;
    private readonly MarkupFilter _markupFilter;

    public BlockListPropertyConverter(IPublishedContentCache publishedContentCache, IMediaService mediaService, IVariationContextAccessor variationContextAccessor)
    {
        _publishedContentCache = publishedContentCache;
        _markupFilter = new MarkupFilter(publishedContentCache, mediaService, variationContextAccessor);
    }

    // This converter pre-renders schemaAccordianBlock content into a ContentArea shape
    // (see ConvertIntermediateToObject). Apply it only to `accordianList` so other
    // BlockList properties (e.g. `promoArea` on schemaPage) return raw Delivery API
    // output and are mapped in TypeScript via BlockTransformer.
    public bool IsConverter(IPublishedPropertyType propertyType)
        => propertyType.EditorAlias.Equals(Constants.PropertyEditors.Aliases.BlockList)
           && "accordianList".Equals(propertyType.Alias);


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

    public Type GetPropertyValueType(IPublishedPropertyType propertyType)
        => typeof(JsonObject);

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

            JsonArray items = [];
            JsonObject blockListObject = JsonSerializer.Deserialize<JsonObject>(raw);
            JsonArray contentDataArray = blockListObject.GetPropertyAsArray("contentData");

            foreach (JsonObject jsonObject in contentDataArray.Cast<JsonObject>())
            {
                string contentTypeKey = jsonObject.GetPropertyAsString("contentTypeKey");

                if ("4c7190f5-ea4b-488e-a6ae-83c11d70d861".Equals(contentTypeKey))
                {
                    // Regular SchemaAccordianBlock

                    string uriString = GetBlockPickerUri(jsonObject);

                    if (uriString is null)
                    {
                        return null;
                    }
                    
                    IPublishedContent? block = _publishedContentCache.GetById(new GuidUdi(new Uri(uriString)).Guid);

                    JsonObject blockObject = new JsonObject();

                    blockObject = AddContentProperties(blockObject, block);
                    JsonObject description = blockObject.GetPropertyAsObject("description");

                    if (description == null)
                    {
                        return null;
                    }

                    JsonArray blockItems = description.GetPropertyAsArray("items");
                    string content = blockItems.ElementAt(0).AsObject().GetPropertyAsString("html");

                    string heading = blockObject.GetPropertyAsString("heading");

                    JsonArray richText = [];
                    richText.Add(new JsonObject
                        {
                            { "html", _markupFilter.FilterMarkup(content) },
                            { "componentName", "RichText" }
                        });

                    JsonObject richTextArea = new JsonObject();
                    richTextArea.Add("componentName", "RichTextArea");
                    richTextArea.Add("items", richText);

                    JsonObject schemaAccordianBlock = new JsonObject
                        {
                            { "componentName", "SchemaAccordianBlock" },
                            { "description", richTextArea},
                            { "heading", heading },
                            { "displayOptionId", "full" },
                            { "displayOptionName", "/displayoptions/full" },
                            { "displayOptionTag", "col-sm-12" }
                        };

                    items.Add(schemaAccordianBlock);
                }
                else
                {
                    // SchemaAccordianBlock constructed based on one of the 5 standard form blocks
                    JsonArray richText = [];
                    richText.Add(new JsonObject
                        {
                            { "html", _markupFilter.FilterMarkup(GetMarkup(jsonObject)) },
                            { "componentName", "RichText" }
                        });

                    JsonObject richTextArea = new()
                    {
                        { "componentName", "RichTextArea" },
                        { "items", richText }
                    };

                    JsonObject schemaAccordianBlock = new()
                    {
                            { "componentName", "SchemaAccordianBlock" },
                            { "description", richTextArea},
                            { "displayOptionId", "full" },
                            { "displayOptionName", "/displayoptions/full" },
                            { "displayOptionTag", "col-sm-12" }
                        };

                    if ("f6598f3e-b675-4dcb-89e8-3c99fbf15889".Equals(contentTypeKey))
                    {
                        // Freetext element
                        schemaAccordianBlock.Add("heading", GetHeading(jsonObject));
                    } else
                    {
                        schemaAccordianBlock.Add("translatedHeading", GetTranslationCode(contentTypeKey));
                    }

                    items.Add(schemaAccordianBlock);
                }
            }                    

            JsonObject accordianList = [];
            accordianList.Add("componentName", "ContentArea");
            accordianList.Add("items", items);
            return accordianList;
        }
        else
        {
            return null;
        }
    }

    private string GetBlockPickerUri(JsonObject contentDataItem)
    {
        // Imported JSON format
        string uriString = contentDataItem.GetPropertyAsString("blockPicker");

        if (!string.IsNullOrEmpty(uriString))
        {
            return uriString;
        }

        // JSON format after republishing
        JsonArray values = contentDataItem.GetPropertyAsArray("values");

        foreach (JsonObject valueObject in values.Cast<JsonObject>())
        {
            return valueObject.GetPropertyAsString("value");
        }

        return null;
    }

    private string? GetHeading(JsonObject jsonObject)
    {
        string heading = jsonObject.GetPropertyAsString("heading");
        if (!string.IsNullOrEmpty(heading))
        {
            return heading;
        }    

        JsonArray values = jsonObject.GetPropertyAsArray("values");

        foreach (JsonObject value in values.Cast<JsonObject>())
        {
            if ("heading".Equals(value.GetPropertyAsString("alias")))
            {
                return value.GetPropertyAsString("value");
            }
        }

        return null;
    }

    private string? GetMarkup(JsonObject jsonObject)
    {

        string content = jsonObject.GetPropertyAsString("content");
        if (!string.IsNullOrEmpty(content))
        {
            return content;
        }

        JsonArray values = jsonObject.GetPropertyAsArray("values");

        foreach (JsonObject value in values.Cast<JsonObject>())
        {
            if ("content".Equals(value.GetPropertyAsString("alias")))
            {
                string richTextJsonString = value.GetPropertyAsString("value");

                if (string.IsNullOrEmpty(richTextJsonString))
                {
                    return null;
                }                

                JsonObject richText = JsonSerializer.Deserialize<JsonObject>(richTextJsonString);
                return richText.GetPropertyAsString("markup");
            }
        }

        return null;
    }    

    private string? GetTranslationCode(string contentTypeKey)
    {
        return contentTypeKey switch
        {
            "42a76f31-3f6a-415c-ba15-c2f5bc9012ef" => "schema.importAccordions.a",
            "5e91d751-a21f-4b73-9490-cdd177c8495f" => "schema.importAccordions.b",
            "00b049e5-5c33-4245-86fe-b95fbb7fbf7b" => "schema.importAccordions.c",
            "f40759db-1340-4c5b-ad4f-f4f0a61fcb00" => "schema.importAccordions.d",
            "951043bd-5cff-4bde-b522-64b983d960b1" => "schema.importAccordions.e",
            _ => null,
        };
    }

    private JsonObject AddContentProperties(JsonObject jsonObject, IPublishedContent content)
    {
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
                    jsonObject.Add(property.Alias, v);
                } else if (value is IApiContent[] a)
                {
                    JsonArray jsonArray = [];
                    foreach (IApiContent apiContent in a)
                    {
                        jsonArray.Add(ConvertBlock(apiContent));
                    }
                    
                    jsonObject.Add(property.Alias, jsonArray);
                } else {
                    jsonObject.Add(property.Alias, value.ConvertToJsonNode());
                }
            }
        }

        return jsonObject;
    }

    private JsonObject ConvertBlock(IApiContent apiContent)
    {
        JsonObject jsonObject = [];
        jsonObject.Add("componentName", Capitalize(apiContent.ContentType));
        IPublishedContent? content = _publishedContentCache.GetById(apiContent.Id);
        jsonObject = AddContentProperties(jsonObject, content);
        return jsonObject;
    }

    private string Capitalize(string value)
    {
        return char.ToUpper(value[0]) + value[1..];
    }

}

