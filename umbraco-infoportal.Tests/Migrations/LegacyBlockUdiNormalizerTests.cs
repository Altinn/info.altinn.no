using System.Text.Json;
using System.Text.Json.Nodes;
using Umbraco.Cms.Core.Models.Blocks;
using Umbraco.Cms.Infrastructure.Serialization;
using umbraco_infoportal.Migrations;

namespace umbraco_infoportal.Tests.Migrations;

public class LegacyBlockUdiNormalizerTests
{
    private static readonly Guid ContentElementKey = Guid.Parse("1b8b1b8d-9a2a-4b1e-9c0d-3f4a5b6c7d8e");
    private static readonly Guid SettingsElementKey = Guid.Parse("2c9c2c9e-0b3b-4c2f-8d1e-4a5b6c7d8e9f");
    private static readonly Guid NestedElementKey = Guid.Parse("5f2f5f21-3e6e-4f5c-9a4b-7d8e9f0a1b23");

    /// <summary>
    /// A Block List value in the pre-Umbraco-15 shape: the layout items carry contentUdi/settingsUdi
    /// instead of contentKey/settingsKey, and the item data carries udi instead of key.
    /// </summary>
    private const string LegacyBlockListValue = """
        {
          "layout": {
            "Umbraco.BlockList": [
              {
                "contentUdi": "umb://element/1b8b1b8d9a2a4b1e9c0d3f4a5b6c7d8e",
                "settingsUdi": "umb://element/2c9c2c9e0b3b4c2f8d1e4a5b6c7d8e9f"
              }
            ]
          },
          "contentData": [
            {
              "contentTypeKey": "3d0d3d0f-1c4c-4d3a-9e2f-5b6c7d8e9f01",
              "udi": "umb://element/1b8b1b8d9a2a4b1e9c0d3f4a5b6c7d8e",
              "values": [
                { "alias": "heading", "value": "Trenger du hjelp?" },
                { "alias": "text", "value": "<p>Kontakt brukerveiledning ved Brønnøysundregistrene</p>" }
              ]
            }
          ],
          "settingsData": [
            {
              "contentTypeKey": "4e1e4e10-2d5d-4e4b-8f3a-6c7d8e9f0a12",
              "udi": "umb://element/2c9c2c9e0b3b4c2f8d1e4a5b6c7d8e9f",
              "values": []
            }
          ],
          "expose": [
            { "contentKey": "1b8b1b8d-9a2a-4b1e-9c0d-3f4a5b6c7d8e", "culture": null, "segment": null }
          ]
        }
        """;

    private const string ModernBlockListValue = """
        {
          "layout": {
            "Umbraco.BlockList": [
              { "contentKey": "1b8b1b8d-9a2a-4b1e-9c0d-3f4a5b6c7d8e" }
            ]
          },
          "contentData": [
            {
              "contentTypeKey": "3d0d3d0f-1c4c-4d3a-9e2f-5b6c7d8e9f01",
              "key": "1b8b1b8d-9a2a-4b1e-9c0d-3f4a5b6c7d8e",
              "values": [ { "alias": "heading", "value": "Trenger du hjelp?" } ]
            }
          ],
          "settingsData": [],
          "expose": [
            { "contentKey": "1b8b1b8d-9a2a-4b1e-9c0d-3f4a5b6c7d8e", "culture": null, "segment": null }
          ]
        }
        """;

    [Fact]
    public void Derives_layout_content_and_settings_keys_from_legacy_udis()
    {
        JsonObject layoutItem = FirstLayoutItem(Normalize(LegacyBlockListValue), "Umbraco.BlockList");

        Assert.Equal(ContentElementKey, KeyOf(layoutItem, "contentKey"));
        Assert.Equal(SettingsElementKey, KeyOf(layoutItem, "settingsKey"));
    }

    [Fact]
    public void Derives_item_data_keys_from_legacy_udis()
    {
        JsonNode result = Parse(Normalize(LegacyBlockListValue));

        Assert.Equal(ContentElementKey, KeyOf((JsonObject)result["contentData"]![0]!, "key"));
        Assert.Equal(SettingsElementKey, KeyOf((JsonObject)result["settingsData"]![0]!, "key"));
    }

    [Fact]
    public void Leaves_legacy_fields_and_all_other_content_in_place()
    {
        JsonNode result = Parse(Normalize(LegacyBlockListValue));

        JsonObject layoutItem = FirstLayoutItem(result, "Umbraco.BlockList");
        Assert.Equal("umb://element/1b8b1b8d9a2a4b1e9c0d3f4a5b6c7d8e", layoutItem["contentUdi"]!.GetValue<string>());
        Assert.Equal("umb://element/2c9c2c9e0b3b4c2f8d1e4a5b6c7d8e9f", layoutItem["settingsUdi"]!.GetValue<string>());

        JsonNode contentItem = result["contentData"]![0]!;
        Assert.Equal("umb://element/1b8b1b8d9a2a4b1e9c0d3f4a5b6c7d8e", contentItem["udi"]!.GetValue<string>());
        Assert.Equal("3d0d3d0f-1c4c-4d3a-9e2f-5b6c7d8e9f01", contentItem["contentTypeKey"]!.GetValue<string>());
        Assert.Equal("Trenger du hjelp?", contentItem["values"]![0]!["value"]!.GetValue<string>());
        Assert.Equal(
            "<p>Kontakt brukerveiledning ved Brønnøysundregistrene</p>",
            contentItem["values"]![1]!["value"]!.GetValue<string>());
        Assert.Single(result["expose"]!.AsArray());
    }

    [Fact]
    public void Reports_no_change_for_a_value_that_is_already_in_the_key_shape()
    {
        Assert.False(LegacyBlockUdiNormalizer.TryNormalize(ModernBlockListValue, out string? normalized));
        Assert.Null(normalized);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("Brønnøysundregistrene")]
    [InlineData("{ this is not json")]
    [InlineData("""{ "markup": "<p>contentUdi is only mentioned in text</p>" }""")]
    public void Reports_no_change_for_values_without_legacy_block_layout(string? storedValue)
    {
        Assert.False(LegacyBlockUdiNormalizer.TryNormalize(storedValue, out string? normalized));
        Assert.Null(normalized);
    }

    [Fact]
    public void Is_idempotent()
    {
        string once = Normalize(LegacyBlockListValue);

        Assert.False(LegacyBlockUdiNormalizer.TryNormalize(once, out string? twice));
        Assert.Null(twice);
    }

    [Fact]
    public void Replaces_a_placeholder_empty_guid_key()
    {
        const string valueWithEmptyKey = """
            {
              "layout": {
                "Umbraco.BlockList": [
                  {
                    "contentKey": "00000000-0000-0000-0000-000000000000",
                    "contentUdi": "umb://element/1b8b1b8d9a2a4b1e9c0d3f4a5b6c7d8e"
                  }
                ]
              },
              "contentData": []
            }
            """;

        JsonObject layoutItem = FirstLayoutItem(Normalize(valueWithEmptyKey), "Umbraco.BlockList");

        Assert.Equal(ContentElementKey, KeyOf(layoutItem, "contentKey"));
    }

    [Fact]
    public void Normalizes_block_grid_items_nested_in_areas()
    {
        const string legacyBlockGridValue = """
            {
              "layout": {
                "Umbraco.BlockGrid": [
                  {
                    "contentUdi": "umb://element/1b8b1b8d9a2a4b1e9c0d3f4a5b6c7d8e",
                    "columnSpan": 12,
                    "areas": [
                      {
                        "key": "6a3a6a32-4f7f-4a6d-8b5c-8e9f0a1b2c34",
                        "items": [
                          { "contentUdi": "umb://element/5f2f5f213e6e4f5c9a4b7d8e9f0a1b23" }
                        ]
                      }
                    ]
                  }
                ]
              },
              "contentData": []
            }
            """;

        JsonObject rootItem = FirstLayoutItem(Normalize(legacyBlockGridValue), "Umbraco.BlockGrid");
        JsonObject areaItem = (JsonObject)rootItem["areas"]![0]!["items"]![0]!;

        Assert.Equal(ContentElementKey, KeyOf(rootItem, "contentKey"));
        Assert.Equal(NestedElementKey, KeyOf(areaItem, "contentKey"));
    }

    [Fact]
    public void Normalizes_a_nested_block_value_that_is_stored_as_a_json_string()
    {
        const string legacyValueWithNestedJsonString = """
            {
              "layout": {
                "Umbraco.BlockList": [
                  { "contentUdi": "umb://element/1b8b1b8d9a2a4b1e9c0d3f4a5b6c7d8e" }
                ]
              },
              "contentData": [
                {
                  "contentTypeKey": "3d0d3d0f-1c4c-4d3a-9e2f-5b6c7d8e9f01",
                  "udi": "umb://element/1b8b1b8d9a2a4b1e9c0d3f4a5b6c7d8e",
                  "values": [
                    {
                      "alias": "innerBlocks",
                      "value": "{\"layout\":{\"Umbraco.BlockList\":[{\"contentUdi\":\"umb://element/5f2f5f213e6e4f5c9a4b7d8e9f0a1b23\"}]},\"contentData\":[{\"udi\":\"umb://element/5f2f5f213e6e4f5c9a4b7d8e9f0a1b23\"}]}"
                    }
                  ]
                }
              ]
            }
            """;

        JsonNode result = Parse(Normalize(legacyValueWithNestedJsonString));
        string nestedJson = result["contentData"]![0]!["values"]![0]!["value"]!.GetValue<string>();
        JsonNode nested = Parse(nestedJson);

        Assert.Equal(NestedElementKey, KeyOf(FirstLayoutItem(nested, "Umbraco.BlockList"), "contentKey"));
        Assert.Equal(NestedElementKey, KeyOf((JsonObject)nested["contentData"]![0]!, "key"));
    }

    [Fact]
    public void Reports_no_change_when_the_legacy_udi_cannot_be_parsed()
    {
        const string valueWithUnparseableUdi = """
            {
              "layout": { "Umbraco.BlockList": [ { "contentUdi": "umb://element/not-a-guid" } ] },
              "contentData": []
            }
            """;

        Assert.False(LegacyBlockUdiNormalizer.TryNormalize(valueWithUnparseableUdi, out string? normalized));
        Assert.Null(normalized);
    }

    /// <summary>
    /// The contract that matters in production: Umbraco's own block value deserializer has to resolve
    /// the layout item to a real element key and keep the content data. On Umbraco 18 the legacy value
    /// fails this because BlockLayoutItemBase no longer maps contentUdi onto ContentKey.
    /// </summary>
    [Fact]
    public void Normalized_value_is_understood_by_the_umbraco_block_value_deserializer()
    {
        // Mirrors Umbraco's own SystemTextJsonSerializer registration. JsonUdiConverter is required
        // because on Umbraco 17 the retained contentUdi field still binds to a Udi typed property.
        JsonSerializerOptions options = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            Converters = { new JsonUdiConverter(), new JsonBlockValueConverter() },
        };

        BlockListValue blockValue = JsonSerializer.Deserialize<BlockListValue>(Normalize(LegacyBlockListValue), options)!;

        BlockListLayoutItem layoutItem = Assert.Single(blockValue.GetLayouts()!);
        Assert.Equal(ContentElementKey, layoutItem.ContentKey);
        Assert.Equal(SettingsElementKey, layoutItem.SettingsKey);
        Assert.Equal(ContentElementKey, Assert.Single(blockValue.ContentData).Key);
        Assert.Equal(SettingsElementKey, Assert.Single(blockValue.SettingsData).Key);
    }

    private static string Normalize(string storedValue)
    {
        Assert.True(LegacyBlockUdiNormalizer.TryNormalize(storedValue, out string? normalized));
        Assert.NotNull(normalized);
        return normalized;
    }

    private static JsonNode Parse(string json) => JsonNode.Parse(json)!;

    private static JsonObject FirstLayoutItem(string json, string propertyEditorAlias) =>
        FirstLayoutItem(Parse(json), propertyEditorAlias);

    private static JsonObject FirstLayoutItem(JsonNode value, string propertyEditorAlias) =>
        (JsonObject)value["layout"]![propertyEditorAlias]![0]!;

    private static Guid KeyOf(JsonObject item, string propertyName) =>
        Guid.Parse(item[propertyName]!.GetValue<string>());
}
