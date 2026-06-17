using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using AngleSharp.Dom;
using AngleSharp.Html.Parser;

namespace Infoportal.RichText;

/// <summary>
/// Normalises editor-authored rich-text HTML for accessibility before it is
/// returned by the Umbraco Delivery API:
///  - collapses stacked &lt;br&gt; runs (screen readers announce each as "blank");
///  - wraps loose link runs in a &lt;ul&gt; so they are announced as a list.
/// Runs server-side over a real DOM (AngleSharp); design-system styling stays
/// in the frontend.
/// </summary>
public static class RichTextNormalizer
{
    private static readonly HtmlParser Parser = new();

    // Matches an opening <a> tag (followed by whitespace or '>'), not <article>/<aside>.
    private static readonly Regex AnchorOpenTag =
        new(@"<a[\s>]", RegexOptions.IgnoreCase | RegexOptions.Compiled);

    // Block-level containers where an injected <ul> is valid markup and where we
    // look for loose link runs. Deliberately excludes <p>, headings and existing
    // lists, so inline links are left untouched.
    private static readonly HashSet<string> LinkListContainers =
        new(StringComparer.OrdinalIgnoreCase)
        {
            "DIV",
            "SECTION",
            "ARTICLE",
            "MAIN",
            "ASIDE",
        };

    public static string Normalize(string? html)
    {
        if (string.IsNullOrWhiteSpace(html))
        {
            return html ?? string.Empty;
        }

        // Cheap pre-check: only touch the DOM when there's something we might
        // change (a <br> to collapse, or 2+ links to maybe wrap). Avoids
        // reserialising the bulk of rich text that needs no normalisation.
        var hasBreak = html.Contains("<br", StringComparison.OrdinalIgnoreCase);
        if (!hasBreak && AnchorOpenTag.Matches(html).Count < 2)
        {
            return html;
        }

        var document = Parser.ParseDocument(html);
        var body = document.Body;
        if (body is null)
        {
            return html;
        }

        CollapseConsecutiveBreaks(body);
        WrapLooseLinkRuns(body);

        return body.InnerHtml;
    }

    // Editors sometimes stack <br><br> for vertical spacing. Collapse any run of
    // consecutive breaks (ignoring whitespace text between them) to a single <br>.
    private static void CollapseConsecutiveBreaks(IElement root)
    {
        foreach (var br in root.QuerySelectorAll("br").ToArray())
        {
            if (PreviousSignificantSibling(br) is IElement { TagName: "BR" })
            {
                br.Remove();
            }
        }
    }

    // A sequence of sibling <a> elements separated only by <br>/whitespace is a
    // link list authored without list semantics; wrap such runs (2+ links) in a
    // <ul><li>. Recurses into block containers only, so inline links inside <p>
    // or headings are left alone.
    private static void WrapLooseLinkRuns(IElement container)
    {
        foreach (var child in container.Children.ToArray())
        {
            if (LinkListContainers.Contains(child.TagName))
            {
                WrapLooseLinkRuns(child);
            }
        }

        foreach (var run in CollectLinkRuns(container))
        {
            var list = container.Owner!.CreateElement("ul");
            container.InsertBefore(list, run[0]);

            foreach (var node in run)
            {
                if (IsAnchor(node))
                {
                    var item = container.Owner!.CreateElement("li");
                    item.AppendChild(node); // moves the anchor out of the container
                    list.AppendChild(item);
                }
                else
                {
                    container.RemoveChild(node); // drop the <br>/whitespace separators
                }
            }
        }
    }

    // Groups of links (plus the separators between them) that should each become
    // one <ul>. Read-only: the caller mutates the tree afterwards.
    private static List<List<INode>> CollectLinkRuns(IElement container)
    {
        var runs = new List<List<INode>>();
        var children = container.ChildNodes.ToArray();
        var i = 0;

        while (i < children.Length)
        {
            if (!IsAnchor(children[i]))
            {
                i++;
                continue;
            }

            var run = new List<INode> { children[i] };
            var lastAnchorIndex = 0;
            var j = i + 1;
            while (j < children.Length)
            {
                var node = children[j];
                if (IsAnchor(node))
                {
                    run.Add(node);
                    lastAnchorIndex = run.Count - 1;
                }
                else if (IsBreak(node) || IsWhitespace(node))
                {
                    run.Add(node);
                }
                else
                {
                    break;
                }

                j++;
            }

            // Drop trailing separators so the run ends on its last link.
            var trimmed = run.Take(lastAnchorIndex + 1).ToList();
            if (trimmed.Count(IsAnchor) >= 2)
            {
                runs.Add(trimmed);
            }

            i = j;
        }

        return runs;
    }

    private static INode? PreviousSignificantSibling(INode node)
    {
        var sibling = node.PreviousSibling;
        while (sibling is not null)
        {
            if (!IsWhitespace(sibling))
            {
                return sibling;
            }

            sibling = sibling.PreviousSibling;
        }

        return null;
    }

    private static bool IsAnchor(INode node) => node is IElement { TagName: "A" };

    private static bool IsBreak(INode node) => node is IElement { TagName: "BR" };

    private static bool IsWhitespace(INode node) =>
        node.NodeType == NodeType.Text && string.IsNullOrWhiteSpace(node.TextContent);
}
