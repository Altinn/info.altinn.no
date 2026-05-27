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
using Umbraco.Cms.Core.Models.DeliveryApi;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Models.ContentEditing;
using Umbraco.Cms.Infrastructure.Migrations.Upgrade.V_15_0_0;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Web.Common.UmbracoContext;
using Umbraco.Cms.Infrastructure.Migrations.Upgrade.V_15_0_0.LocalLinks;
using Examine;

// Injecting the IPublishedContentCache for fetching content from the Umbraco cache
public class RichTextPropertyConverter : IPropertyValueConverter
{
    private readonly IJsonSerializer _json;
    private readonly ILogger<RichTextPropertyConverter> _logger;

    private readonly IPublishedContentCache _publishedContentCache;
    private readonly IMediaService _mediaService;

    //private readonly IMediaUrlGenerator _mediaUrlGenerator;

    public RichTextPropertyConverter(IJsonSerializer json, ILogger<RichTextPropertyConverter> logger, IPublishedContentCache publishedContentCache, IMediaService mediaService)
    {
        _json = json;
        _logger = logger;
        _publishedContentCache = publishedContentCache;
        _mediaService = mediaService;
        //_mediaUrlGenerator = mediaUrlGenerator;
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

            if (!raw.StartsWith('{'))
            {
                JsonArray items = [];
                items.Add(new JsonObject
                {
                    { "html", raw },
                    { "componentName", "RichText" }
                });

                return new JsonObject { { "items", items } };
            }

            return new JsonObject { { "items", ParseRichText(raw) } };
        }
        else
        {
            return null;
        }
    }

    private JsonArray ParseRichText(string rawValue)
    {
        string pattern = @"<umb-rte-block data-content-key=""(?<contentguid>[0-9a-fA-F]{8}(?:-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12})""></umb-rte-block>";

        JsonObject rteValue = JsonSerializer.Deserialize<JsonNode>(rawValue).AsObject();

        JsonArray items = [];
        string markup = rteValue.GetPropertyAsString("markup");
        markup = ReplaceImages(markup);
        markup = ReplaceMediaLinks(markup);

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

            JsonObject blockItemData = GetContentDataItem(blockGuid, rteValue);

            if (blockItemData is null)
            {
                return items;
            }

            string blockPickerValue = blockItemData.GetPropertyAsString("blockPicker");

            JsonObject jsonObject = ConvertPickerBlock(blockPickerValue);
            items.Add(jsonObject);

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

        Console.WriteLine("Markup: " + markup);
        return items;
    }

    private string ReplaceImages(string markup)
    {
        string pattern = @"<img data-udi=""umb://media/(?<udi>[0-9a-fA-F]{32})"" src=""(?<src>[^""]+)";

        Match match = Regex.Match(markup, pattern);

        while (match.Success)
        {
            string udiString = "umb://media/" + match.Groups["udi"].Value;
            GuidUdi guidUdi = (GuidUdi) UdiParser.Parse(udiString);
            string? url = ResolveMediaUrl(guidUdi.Guid);
            string src = match.Groups["src"].Value;

            markup = markup.Replace($" data-udi=\"{udiString}\"", "");
            markup = markup.Replace(src, url);

            match = Regex.Match(markup, pattern);
        }

        return markup;
    }

    private string ReplaceMediaLinks(string markup)
    {
        string pattern = @"href=""/{localLink:(?<contentguid>[0-9a-fA-F]{8}(?:-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12})}""";

        Match match = Regex.Match(markup, pattern);

        while (match.Success)
        {
            string contentGUID = match.Groups["contentguid"].Value;

            Guid guid = Guid.Parse(contentGUID);
            string url = ResolveMediaUrl(guid);
            markup = markup.Replace("/{localLink:" + contentGUID + "}", url);

            match = Regex.Match(markup, pattern);
        }

        return markup;        
    }

    private string? ResolveMediaUrl(Guid guid)
    {
        IMedia media = _mediaService.GetById(guid);

        if (media is null)
        {
            return null;
        }

        string? umbracoFileJson = media.GetValue<string>("umbracoFile");

        if (umbracoFileJson is null)
        {
            return null;
        }

        JsonObject umbracoFile = JsonSerializer.Deserialize<JsonObject>(umbracoFileJson);
        return umbracoFile.GetPropertyAsString("src");
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

    private JsonObject GetContentDataItem(Guid guid, JsonObject rteValue)
    {
        JsonObject blocks = rteValue.GetPropertyAsObject("blocks");

        if (blocks is null)
        {
            return null;
        }

        
        JsonArray contentData = blocks.GetPropertyAsArray("contentData");
        if (contentData is null)
        {
            return null;
        }

        foreach (JsonNode contentDataItem in contentData)
        {
            string udiString = contentDataItem.AsObject().GetPropertyAsString("udi");

            if (string.IsNullOrEmpty(udiString))
            {
                return null;
            }

            Uri uri = new Uri(udiString);
            Guid currentGuid = new GuidUdi(uri).Guid;

            if (currentGuid.Equals(guid))
            {
                return contentDataItem.AsObject();
            }
        }

        return null;
    }

    private JsonObject ConvertPickerBlock(string blockPickerValue)
    {
        JsonObject item = new JsonObject();
        

        Uri uri = new Uri(blockPickerValue);

        if (string.IsNullOrEmpty(blockPickerValue))
        {
            return item;
        }

        IPublishedContent? content = _publishedContentCache.GetById(new GuidUdi(uri).Guid);
        
        if ("tableBlock".Equals(content.ContentType.Alias))
        {
            item.Add("componentName", "RichText");
            IPublishedProperty property = content.GetProperty("table");

            if (property is null)
            {
                return item;
            }


            object value = property.GetDeliveryApiValue(true);

            if (value is null)
            {
                return item;
            }

            if (value is JsonObject jsonObject) {
                item.Add("html", GetMarkup(jsonObject));
            } else if (value is RichTextEditorValue rteValue) {
                item.Add("html", rteValue.Markup);
            }
        } else if ("linkBlock".Equals(content.ContentType.Alias))
        {
            item.Add("componentName", "LinkBlock");
            item = AddContentProperties(item, content);
            string url = item.GetPropertyAsString("urlBlock");
            string linkText = item.GetPropertyAsString("extraTitle");
            JsonObject linkObject = [];
            linkObject["url"] = url;
            linkObject["openInNewWindow"] = true;
            linkObject["componentName"] = "UrlBlock";
            linkObject["linkText"] = linkText;
            item["link"] = linkObject;
        } else {
            item.Add("componentName", Capitalize(content.ContentType.Alias));
           
            item = AddContentProperties(item, content);    
        }
        return item;
    }

    private string? GetMarkup(JsonObject jsonObject)
    {
        JsonArray items = jsonObject.GetPropertyAsArray("items");
        
        foreach (JsonObject item in items)
        {
            return item.GetPropertyAsString("html");
        }

        return null;
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

