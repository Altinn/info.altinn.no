using System.Diagnostics.CodeAnalysis;
using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.Unicode;

namespace umbraco_infoportal.Migrations;

/// <summary>
/// Rewrites block editor values that are stored in the pre-Umbraco-15 "Udi" shape into the
/// current "key" shape, so that Umbraco 18 can read them.
/// </summary>
/// <remarks>
/// <para>
/// Umbraco 17 and earlier mapped the legacy <c>contentUdi</c>/<c>settingsUdi</c> layout fields onto
/// <c>ContentKey</c>/<c>SettingsKey</c> through an obsolete shim on <c>BlockLayoutItemBase</c>.
/// Umbraco 18 removed that shim, so a layout item that only carries <c>contentUdi</c> now
/// deserializes with an empty <c>ContentKey</c>. The block editor then treats every entry in
/// <c>contentData</c> as an orphan and discards it, which is why the backoffice renders the block as
/// "Unsupported" and the front end renders nothing at all.
/// </para>
/// <para>
/// The rewrite is deliberately additive: the legacy fields are left untouched and the derived
/// <c>contentKey</c>/<c>settingsKey</c>/<c>key</c> fields are only written when they are missing or
/// hold an empty GUID. That makes it idempotent, and it cannot destroy a value it does not understand.
/// </para>
/// </remarks>
public static class LegacyBlockUdiNormalizer
{
    private const string ContentUdiPropertyName = "contentUdi";
    private const string ContentKeyPropertyName = "contentKey";
    private const string SettingsUdiPropertyName = "settingsUdi";
    private const string SettingsKeyPropertyName = "settingsKey";
    private const string UdiPropertyName = "udi";
    private const string KeyPropertyName = "key";
    private const string ContentDataPropertyName = "contentData";
    private const string SettingsDataPropertyName = "settingsData";
    private const string UdiScheme = "umb://";

    /// <remarks>
    /// Mirrors Umbraco's own <c>DefaultJsonSerializerEncoderFactory</c> so that a rewritten value is
    /// encoded exactly the way Umbraco encodes it when an editor saves the same document.
    /// </remarks>
    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        Encoder = JavaScriptEncoder.Create(UnicodeRanges.BasicLatin),
    };

    /// <summary>
    /// Adds the "key" shaped fields that Umbraco 18 needs, derived from the legacy Udi fields.
    /// </summary>
    /// <param name="storedValue">The raw property value as stored in umbracoPropertyData.</param>
    /// <param name="normalizedValue">The rewritten value, or <c>null</c> when nothing changed.</param>
    /// <returns><c>true</c> when the value was rewritten; otherwise <c>false</c>.</returns>
    public static bool TryNormalize(string? storedValue, [NotNullWhen(true)] out string? normalizedValue)
    {
        normalizedValue = null;

        if (!ContainsLegacyUdi(storedValue) || !TryParseJson(storedValue, out JsonNode? root))
        {
            return false;
        }

        if (!NormalizeNode(root, inBlockItemData: false))
        {
            return false;
        }

        normalizedValue = root.ToJsonString(SerializerOptions);
        return true;
    }

    private static bool NormalizeNode(JsonNode? node, bool inBlockItemData) => node switch
    {
        JsonObject item => NormalizeObject(item, inBlockItemData),
        JsonArray items => NormalizeArray(items, inBlockItemData),
        _ => false,
    };

    private static bool NormalizeObject(JsonObject item, bool inBlockItemData)
    {
        bool changed = TryDeriveKey(item, ContentUdiPropertyName, ContentKeyPropertyName);
        changed |= TryDeriveKey(item, SettingsUdiPropertyName, SettingsKeyPropertyName);

        // Only the entries of contentData/settingsData use the bare "udi" field; rewriting it
        // anywhere else risks colliding with an unrelated editor that happens to store a "udi".
        if (inBlockItemData)
        {
            changed |= TryDeriveKey(item, UdiPropertyName, KeyPropertyName);
        }

        foreach (string propertyName in item.Select(property => property.Key).ToArray())
        {
            bool childIsBlockItemData = propertyName is ContentDataPropertyName or SettingsDataPropertyName;

            if (TryNormalizeEncodedValue(item[propertyName], childIsBlockItemData, out JsonNode? rewritten))
            {
                item[propertyName] = rewritten;
                changed = true;
                continue;
            }

            changed |= NormalizeNode(item[propertyName], childIsBlockItemData);
        }

        return changed;
    }

    private static bool NormalizeArray(JsonArray items, bool inBlockItemData)
    {
        bool changed = false;

        for (int index = 0; index < items.Count; index++)
        {
            if (TryNormalizeEncodedValue(items[index], inBlockItemData, out JsonNode? rewritten))
            {
                items[index] = rewritten;
                changed = true;
                continue;
            }

            changed |= NormalizeNode(items[index], inBlockItemData);
        }

        return changed;
    }

    /// <summary>
    /// Handles nested block values that are stored as a JSON string inside a property value, which is
    /// how block editors nested in another block editor were persisted before Umbraco 15.
    /// </summary>
    private static bool TryNormalizeEncodedValue(
        JsonNode? node,
        bool inBlockItemData,
        [NotNullWhen(true)] out JsonNode? rewritten)
    {
        rewritten = null;

        if (node?.GetValueKind() != JsonValueKind.String)
        {
            return false;
        }

        string encoded = node.GetValue<string>();

        if (!ContainsLegacyUdi(encoded)
            || !TryParseJson(encoded, out JsonNode? nested)
            || !NormalizeNode(nested, inBlockItemData))
        {
            return false;
        }

        rewritten = JsonValue.Create(nested.ToJsonString(SerializerOptions));
        return rewritten is not null;
    }

    private static bool TryDeriveKey(JsonObject item, string udiPropertyName, string keyPropertyName)
    {
        if (!item.TryGetPropertyValue(udiPropertyName, out JsonNode? udi)
            || !TryParseElementKey(udi, out Guid key)
            || HasUsableKey(item, keyPropertyName))
        {
            return false;
        }

        item[keyPropertyName] = key.ToString();
        return true;
    }

    private static bool HasUsableKey(JsonObject item, string keyPropertyName) =>
        item.TryGetPropertyValue(keyPropertyName, out JsonNode? existing)
        && existing?.GetValueKind() == JsonValueKind.String
        && Guid.TryParse(existing.GetValue<string>(), out Guid existingKey)
        && existingKey != Guid.Empty;

    private static bool TryParseElementKey(JsonNode? udi, out Guid key)
    {
        key = Guid.Empty;

        if (udi?.GetValueKind() != JsonValueKind.String)
        {
            return false;
        }

        string value = udi.GetValue<string>();

        if (!value.StartsWith(UdiScheme, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        int separator = value.LastIndexOf('/');

        return separator >= 0 && Guid.TryParse(value.AsSpan(separator + 1), out key) && key != Guid.Empty;
    }

    private static bool ContainsLegacyUdi([NotNullWhen(true)] string? storedValue) =>
        !string.IsNullOrWhiteSpace(storedValue)
        && (storedValue.Contains(ContentUdiPropertyName, StringComparison.Ordinal)
            || storedValue.Contains(SettingsUdiPropertyName, StringComparison.Ordinal));

    private static bool TryParseJson(string json, [NotNullWhen(true)] out JsonNode? node)
    {
        try
        {
            node = JsonNode.Parse(json);
        }
        catch (JsonException)
        {
            node = null;
        }

        return node is not null;
    }
}
