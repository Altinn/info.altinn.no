using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;

namespace Infoportal.RichText;

public enum LegacyLinkTargetType
{
    Document,
    Media,
}

public record LegacyLinkTarget(Guid Key, LegacyLinkTargetType Type);

public record LegacyLinkChange(Guid OldKey, Guid? NewKey, string OldHref, string? NewHref);

/// <summary>
/// Rewrites internal links kept from the old CMS (href="~/link/{32 hex}.aspx")
/// to Umbraco local links (href="/{localLink:guid}" type="document"), so Umbraco
/// tracks the references. Query strings, fragments and other attributes are kept.
/// Works on plain HTML as well as JSON property values (RTE/block list) where the
/// markup is nested inside string values.
/// Temporary: remove together with MarkupFilter.ReplaceLegacyLinks once all
/// environments have been migrated (#710).
/// </summary>
public static class LegacyLinkRewriter
{
    private static readonly Regex AnchorTag = new(
        @"<a\b[^>]*>", RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private static readonly Regex LegacyHref = new(
        @"\bhref\s*=\s*(?<q>[""'])~/link/(?<guid>[0-9a-fA-F]{32})\.aspx(?<suffix>[^""']*)\k<q>",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private static readonly Regex TypeAttribute = new(
        @"\btype\s*=\s*(?<q>[""'])[^""']*\k<q>",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
    };

    public static bool ContainsLegacyLink(string? value) =>
        !string.IsNullOrEmpty(value) && value.Contains("~/link/", StringComparison.OrdinalIgnoreCase);

    /// <summary>
    /// Rewrites a stored property value. <paramref name="resolve"/> maps the old
    /// key to the new target, or returns null when the link can't be resolved
    /// (the link is then left unchanged and reported with NewKey = null).
    /// </summary>
    public static string Rewrite(string value, Func<Guid, LegacyLinkTarget?> resolve, List<LegacyLinkChange> changes)
    {
        if (!ContainsLegacyLink(value))
        {
            return value;
        }

        string trimmed = value.TrimStart();
        if (trimmed.StartsWith('{') || trimmed.StartsWith('['))
        {
            JsonNode? node = TryParseJson(value);
            if (node is not null)
            {
                return RewriteJson(node, resolve, changes) ? node.ToJsonString(JsonOptions) : value;
            }
        }

        return RewriteHtml(value, resolve, changes);
    }

    public static string RewriteHtml(string markup, Func<Guid, LegacyLinkTarget?> resolve, List<LegacyLinkChange> changes)
    {
        return AnchorTag.Replace(markup, tagMatch =>
        {
            string tag = tagMatch.Value;
            Match hrefMatch = LegacyHref.Match(tag);

            if (!hrefMatch.Success)
            {
                return tag;
            }

            Guid oldKey = Guid.ParseExact(hrefMatch.Groups["guid"].Value, "N");
            string oldHref = $"~/link/{hrefMatch.Groups["guid"].Value}.aspx{hrefMatch.Groups["suffix"].Value}";
            LegacyLinkTarget? target = resolve(oldKey);

            if (target is null)
            {
                changes.Add(new LegacyLinkChange(oldKey, null, oldHref, null));
                return tag;
            }

            string quote = hrefMatch.Groups["q"].Value;
            string newHref = $"/{{localLink:{target.Key:D}}}{hrefMatch.Groups["suffix"].Value}";
            string typeValue = target.Type == LegacyLinkTargetType.Media ? "media" : "document";

            string newTag = tag[..hrefMatch.Index]
                + $"href={quote}{newHref}{quote}"
                + tag[(hrefMatch.Index + hrefMatch.Length)..];

            newTag = TypeAttribute.IsMatch(newTag)
                ? TypeAttribute.Replace(newTag, $"type={quote}{typeValue}{quote}", 1)
                : newTag.Insert(newTag.Length - (newTag.EndsWith("/>") ? 2 : 1), $" type={quote}{typeValue}{quote}");

            changes.Add(new LegacyLinkChange(oldKey, target.Key, oldHref, newHref));
            return newTag;
        });
    }

    // Walks the JSON tree and rewrites every string leaf. Returns true if anything changed.
    private static bool RewriteJson(JsonNode node, Func<Guid, LegacyLinkTarget?> resolve, List<LegacyLinkChange> changes)
    {
        bool changed = false;

        switch (node)
        {
            case JsonObject obj:
                foreach (string key in obj.Select(p => p.Key).ToList())
                {
                    changed |= RewriteChild(obj[key], replacement => obj[key] = replacement, resolve, changes);
                }
                break;
            case JsonArray array:
                for (int i = 0; i < array.Count; i++)
                {
                    int index = i;
                    changed |= RewriteChild(array[i], replacement => array[index] = replacement, resolve, changes);
                }
                break;
        }

        return changed;
    }

    private static bool RewriteChild(JsonNode? child, Action<JsonNode> replace, Func<Guid, LegacyLinkTarget?> resolve, List<LegacyLinkChange> changes)
    {
        if (child is JsonValue value && value.TryGetValue(out string? text))
        {
            if (!ContainsLegacyLink(text))
            {
                return false;
            }

            string rewritten = Rewrite(text, resolve, changes);
            if (rewritten == text)
            {
                return false;
            }

            replace(JsonValue.Create(rewritten));
            return true;
        }

        return child is not null && RewriteJson(child, resolve, changes);
    }

    private static JsonNode? TryParseJson(string value)
    {
        try
        {
            return JsonNode.Parse(value);
        }
        catch (JsonException)
        {
            return null;
        }
    }
}
