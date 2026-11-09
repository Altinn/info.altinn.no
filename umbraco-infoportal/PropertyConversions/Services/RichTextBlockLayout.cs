using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json.Nodes;
using AngleSharp.Dom;
using AngleSharp.Html.Parser;

namespace Infoportal.Cms.PropertyConversions.Services;

/// <summary>
/// Moves rich-text blocks (&lt;umb-rte-block&gt;) out of nested positions so
/// that the rich text can safely be split into separate items at each block.
///
/// RichTextPropertyConverter splits the markup at every block and Astro renders
/// each piece as its own &lt;div class="rich-text"&gt;. A block placed inside
/// e.g. a list item therefore cut the list in two: the first piece ended with
/// an unclosed &lt;ol&gt;&lt;li&gt; and the next started with loose &lt;li&gt;s,
/// which broke numbering, indentation and list semantics (issue #424).
///
/// Every block that is not a direct child of the body is handled here:
///  - link blocks (UrlBlock/LinkBlock) are rendered as plain links in place,
///    so the surrounding list stays intact;
///  - any other block is moved to just after the top-level element that
///    contains it, so the split happens between top-level elements.
/// Markup with only top-level blocks is returned unchanged.
/// </summary>
public static class RichTextBlockLayout
{
    private const string BlockTag = "umb-rte-block";
    private const string BlockKeyAttribute = "data-content-key";

    private static readonly HtmlParser Parser = new();

    // Contexts that only allow phrasing content, where a wrapping <p> or <ul>
    // would be invalid; links placed there are separated by <br> instead.
    private static readonly HashSet<string> PhrasingContainers =
        new(StringComparer.OrdinalIgnoreCase)
        {
            "P", "A", "SPAN", "STRONG", "B", "EM", "I", "U", "S", "SUB", "SUP",
            "H1", "H2", "H3", "H4", "H5", "H6", "LABEL", "SMALL", "CODE",
        };

    /// <param name="markup">Rich-text markup that may contain &lt;umb-rte-block&gt; elements.</param>
    /// <param name="resolveBlock">
    /// Returns the converted block item (as produced for RichTextArea, with a
    /// componentName) for a block's content key, or null if it can't be resolved.
    /// </param>
    public static string LiftNestedBlocks(string? markup, Func<Guid, JsonObject?> resolveBlock)
    {
        if (string.IsNullOrEmpty(markup)
            || !markup.Contains("<" + BlockTag, StringComparison.OrdinalIgnoreCase))
        {
            return markup ?? string.Empty;
        }

        var document = Parser.ParseDocument(markup);
        var body = document.Body;
        if (body is null)
        {
            return markup;
        }

        var nestedBlocks = body
            .QuerySelectorAll(BlockTag)
            .Where(block => block.ParentElement != body)
            .ToList();

        if (nestedBlocks.Count == 0)
        {
            // Nothing to fix: keep the markup byte-for-byte as it was.
            return markup;
        }

        var links = new Dictionary<IElement, LinkData>();
        var hoistAnchors = new Dictionary<IElement, INode>();

        foreach (var block in nestedBlocks)
        {
            var item = ResolveBlock(block, resolveBlock);

            if (item is null)
            {
                // Unknown block data: drop it rather than letting it break the
                // surrounding structure.
                block.Remove();
                continue;
            }

            if (TryGetLink(item, out var link))
            {
                links[block] = link;
                continue;
            }

            HoistAfterTopLevelAncestor(block, body, hoistAnchors);
        }

        foreach (var group in GroupAdjacent(links.Keys.ToList()))
        {
            ReplaceWithLinks(group, links, document);
        }

        return body.InnerHtml;
    }

    private static JsonObject? ResolveBlock(IElement block, Func<Guid, JsonObject?> resolveBlock)
    {
        var key = block.GetAttribute(BlockKeyAttribute);
        if (!Guid.TryParse(key, out var guid))
        {
            return null;
        }

        var item = resolveBlock(guid);
        return item is not null && item.ContainsKey("componentName") ? item : null;
    }

    // Moves the block to right after the top-level element that contains it.
    // Several blocks from the same ancestor keep their original order.
    private static void HoistAfterTopLevelAncestor(
        IElement block,
        IElement body,
        Dictionary<IElement, INode> hoistAnchors)
    {
        var topLevel = block;
        while (topLevel.ParentElement is not null && topLevel.ParentElement != body)
        {
            topLevel = topLevel.ParentElement;
        }

        var insertAfter = hoistAnchors.TryGetValue(topLevel, out var anchor) ? anchor : topLevel;
        body.InsertBefore(block, insertAfter.NextSibling);
        hoistAnchors[topLevel] = block;
    }

    // Groups link blocks that are siblings separated only by whitespace, so a
    // run of links becomes one list instead of several single links.
    private static List<List<IElement>> GroupAdjacent(List<IElement> blocks)
    {
        var set = new HashSet<IElement>(blocks);
        var seen = new HashSet<IElement>();
        var groups = new List<List<IElement>>();

        foreach (var block in blocks)
        {
            if (!seen.Add(block))
            {
                continue;
            }

            var group = new List<IElement> { block };
            var next = NextSignificantSibling(block);
            while (next is IElement element && set.Contains(element))
            {
                group.Add(element);
                seen.Add(element);
                next = NextSignificantSibling(element);
            }

            groups.Add(group);
        }

        return groups;
    }

    private static void ReplaceWithLinks(
        List<IElement> group,
        Dictionary<IElement, LinkData> links,
        IDocument document)
    {
        var first = group[0];
        var parent = first.ParentElement!;
        var anchors = group.Select(block => CreateAnchor(document, links[block])).ToList();

        INode replacement;
        if (PhrasingContainers.Contains(parent.TagName))
        {
            var fragment = document.CreateDocumentFragment();
            for (var i = 0; i < anchors.Count; i++)
            {
                if (i > 0)
                {
                    fragment.AppendChild(document.CreateElement("br"));
                }
                fragment.AppendChild(anchors[i]);
            }
            replacement = fragment;
        }
        else if (anchors.Count == 1)
        {
            var paragraph = document.CreateElement("p");
            paragraph.AppendChild(anchors[0]);
            replacement = paragraph;
        }
        else
        {
            // Same convention as RichTextNormalizer: a run of links is a list.
            var list = document.CreateElement("ul");
            foreach (var anchor in anchors)
            {
                var listItem = document.CreateElement("li");
                listItem.AppendChild(anchor);
                list.AppendChild(listItem);
            }
            replacement = list;
        }

        parent.InsertBefore(replacement, first);

        // Remove the blocks and the whitespace between them.
        var last = group[^1];
        var node = (INode)first;
        while (node is not null)
        {
            var next = node.NextSibling;
            parent.RemoveChild(node);
            if (node == last)
            {
                break;
            }
            node = next!;
        }
    }

    private static IElement CreateAnchor(IDocument document, LinkData link)
    {
        var anchor = document.CreateElement("a");
        anchor.SetAttribute("href", link.Url);
        anchor.SetAttribute("class", "ds-link");
        if (link.OpenInNewWindow)
        {
            anchor.SetAttribute("target", "_blank");
            anchor.SetAttribute("rel", "noopener noreferrer");
        }
        anchor.TextContent = link.Text;
        return anchor;
    }

    // Reads url/text from a converted UrlBlock or LinkBlock item.
    private static bool TryGetLink(JsonObject item, out LinkData link)
    {
        link = default;
        var componentName = GetString(item, "componentName");

        if (componentName == "UrlBlock")
        {
            return TryCreateLink(item, out link);
        }

        if (componentName == "LinkBlock")
        {
            // Same precedence as the LinkBlock component: the built `link`
            // view-model first, then the first picked url block.
            if (item["link"] is JsonObject builtLink && TryCreateLink(builtLink, out link))
            {
                return true;
            }

            if (item["urlBlock"] is JsonArray picked
                && picked.FirstOrDefault() is JsonObject first
                && TryCreateLink(first, out link))
            {
                return true;
            }
        }

        return false;
    }

    private static bool TryCreateLink(JsonObject source, out LinkData link)
    {
        var url = GetString(source, "url");
        var text = GetString(source, "linkText");

        // A picker value serialised as a string ("[{...}]") is not a URL.
        if (string.IsNullOrWhiteSpace(url)
            || string.IsNullOrWhiteSpace(text)
            || url.TrimStart().StartsWith('[')
            || url.TrimStart().StartsWith('{'))
        {
            link = default;
            return false;
        }

        var openInNewWindow = source["openInNewWindow"] is JsonValue value
            && value.TryGetValue<bool>(out var flag)
            && flag;

        link = new LinkData(url.Trim(), text.Trim(), openInNewWindow);
        return true;
    }

    private static string? GetString(JsonObject source, string key) =>
        source[key] is JsonValue value && value.TryGetValue<string>(out var text) ? text : null;

    private static INode? NextSignificantSibling(INode node)
    {
        var sibling = node.NextSibling;
        while (sibling is not null
            && sibling.NodeType == NodeType.Text
            && string.IsNullOrWhiteSpace(sibling.TextContent))
        {
            sibling = sibling.NextSibling;
        }

        return sibling;
    }

    private readonly record struct LinkData(string Url, string Text, bool OpenInNewWindow);
}
