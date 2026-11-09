using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using AngleSharp.Html.Parser;
using Infoportal.Cms.PropertyConversions.Services;

namespace Infoportal.Cms.Tests.PropertyConversions;

public class RichTextBlockLayoutTests
{
    private static readonly Guid Link1 = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid Link2 = Guid.Parse("22222222-2222-2222-2222-222222222222");
    private static readonly Guid Table = Guid.Parse("33333333-3333-3333-3333-333333333333");
    private static readonly Guid Missing = Guid.Parse("44444444-4444-4444-4444-444444444444");
    private static readonly Guid NewWindow = Guid.Parse("55555555-5555-5555-5555-555555555555");
    private static readonly Guid Legacy = Guid.Parse("66666666-6666-6666-6666-666666666666");
    private static readonly Guid Escaped = Guid.Parse("77777777-7777-7777-7777-777777777777");

    private static JsonObject? Resolve(Guid key)
    {
        if (key == Link1) return UrlBlock("https://example.com/1", "Lenke 1");
        if (key == Link2) return UrlBlock("https://example.com/2", "Lenke 2");
        if (key == NewWindow) return UrlBlock("https://example.com/ny", "Ny fane", openInNewWindow: true);
        if (key == Escaped) return UrlBlock("https://example.com/?a=1&b=2", "A & B <c>");
        if (key == Table) return new JsonObject { ["componentName"] = "RichText", ["html"] = "<table></table>" };
        if (key == Legacy)
        {
            return new JsonObject
            {
                ["componentName"] = "LinkBlock",
                ["link"] = new JsonObject { ["componentName"] = "UrlBlock" },
                ["urlBlock"] = new JsonArray(UrlBlock("https://example.com/legacy", "Legacy")),
            };
        }
        return null;
    }

    private static JsonObject UrlBlock(string url, string text, bool openInNewWindow = false) => new()
    {
        ["componentName"] = "UrlBlock",
        ["url"] = url,
        ["linkText"] = text,
        ["openInNewWindow"] = openInNewWindow,
    };

    private static string Block(Guid key) =>
        $"<umb-rte-block data-content-key=\"{key}\"></umb-rte-block>";

    private static int Count(string html, string pattern) =>
        Regex.Matches(html, pattern, RegexOptions.IgnoreCase).Count;

    private static AngleSharp.Dom.IElement Body(string html) =>
        new HtmlParser().ParseDocument(html).Body!;

    [Fact]
    public void Leaves_markup_without_blocks_untouched()
    {
        const string html = "<ol><li><p>1</p></li></ol>";
        Assert.Same(html, RichTextBlockLayout.LiftNestedBlocks(html, Resolve));
    }

    [Fact]
    public void Leaves_markup_with_only_top_level_blocks_untouched()
    {
        var html = $"<p>a</p>{Block(Link1)}<ul><li>b</li></ul>{Block(Table)}";
        Assert.Same(html, RichTextBlockLayout.LiftNestedBlocks(html, Resolve));
    }

    [Fact]
    public void Renders_link_block_inside_list_item_as_link_and_keeps_list_whole()
    {
        var html = $"<ol><li><p>Steg 1:</p>{Block(Link1)}</li><li><p>Steg 2</p></li></ol>";

        var output = RichTextBlockLayout.LiftNestedBlocks(html, Resolve);

        Assert.DoesNotContain("umb-rte-block", output);
        var body = Body(output);
        var list = Assert.Single(body.Children);
        Assert.Equal("OL", list.TagName);
        Assert.Equal(2, list.Children.Length);
        var link = list.Children[0].QuerySelector("p > a.ds-link");
        Assert.NotNull(link);
        Assert.Equal("https://example.com/1", link!.GetAttribute("href"));
        Assert.Equal("Lenke 1", link.TextContent);
    }

    [Fact]
    public void Wraps_adjacent_link_blocks_in_one_list_inside_the_list_item()
    {
        var html = $"<ol><li><p>Steg 1:</p>{Block(Link1)} {Block(Link2)}</li></ol>";

        var output = RichTextBlockLayout.LiftNestedBlocks(html, Resolve);

        var item = Body(output).QuerySelector("ol > li")!;
        var links = item.QuerySelectorAll("li > ul > li > a.ds-link");
        Assert.Equal(2, links.Length);
        Assert.Equal("Lenke 1", links[0].TextContent);
        Assert.Equal("Lenke 2", links[1].TextContent);
    }

    [Fact]
    public void Matches_the_ans_da_accordion_from_issue_424()
    {
        // Shape of the "Slik stifter og registrerer dere …" accordion: link
        // blocks inside steps 1 and 3 of a four-step numbered list.
        var html =
            "<ol>" +
            $"<li><p>1. Stift selskapet:</p>{Block(Link1)}{Block(Link2)}</li>" +
            "<li><p>2. Innskudd</p></li>" +
            $"<li><p>3. Registrer selskapet:</p>{Block(Link1)}{Block(Link2)}</li>" +
            "<li><p>4. Send skjemaene</p></li>" +
            "</ol><p>Det koster …</p>";

        var output = RichTextBlockLayout.LiftNestedBlocks(html, Resolve);

        var body = Body(output);
        Assert.Equal(1, Count(output, "<ol"));
        Assert.Equal(4, body.QuerySelectorAll("ol > li").Length);
        Assert.Equal(4, body.QuerySelectorAll("ol > li a.ds-link").Length);
        Assert.DoesNotContain(body.QuerySelectorAll("li"), li => li.ParentElement?.TagName is not ("OL" or "UL"));
    }

    [Fact]
    public void Opens_in_new_window_when_the_block_says_so()
    {
        var html = $"<ul><li>{Block(NewWindow)}</li></ul>";

        var link = Body(RichTextBlockLayout.LiftNestedBlocks(html, Resolve)).QuerySelector("a")!;

        Assert.Equal("_blank", link.GetAttribute("target"));
        Assert.Equal("noopener noreferrer", link.GetAttribute("rel"));
    }

    [Fact]
    public void Escapes_link_text_and_url()
    {
        var html = $"<ul><li>{Block(Escaped)}</li></ul>";

        var output = RichTextBlockLayout.LiftNestedBlocks(html, Resolve);
        var link = Body(output).QuerySelector("a")!;

        Assert.Equal("A & B <c>", link.TextContent);
        Assert.Equal("https://example.com/?a=1&b=2", link.GetAttribute("href"));
        Assert.DoesNotContain("<c>", output);
    }

    [Fact]
    public void Uses_picked_url_block_for_legacy_link_block()
    {
        var html = $"<ul><li>{Block(Legacy)}</li></ul>";

        var link = Body(RichTextBlockLayout.LiftNestedBlocks(html, Resolve)).QuerySelector("ul > li a")!;

        Assert.Equal("https://example.com/legacy", link.GetAttribute("href"));
        Assert.Equal("Legacy", link.TextContent);
    }

    [Fact]
    public void Uses_line_breaks_instead_of_wrappers_inside_a_paragraph()
    {
        var html = $"<div><p>Se {Block(Link1)}{Block(Link2)}</p></div>";

        var output = RichTextBlockLayout.LiftNestedBlocks(html, Resolve);

        Assert.Equal(0, Count(output, "<ul"));
        Assert.Equal(1, Count(output, "<p"));
        Assert.Equal(2, Body(output).QuerySelectorAll("p > a").Length);
        Assert.Equal(1, Count(output, "<br"));
    }

    [Fact]
    public void Moves_other_nested_blocks_after_the_top_level_element()
    {
        var html = $"<p>før</p><ol><li>a{Block(Table)}</li><li>b</li></ol><p>etter</p>";

        var output = RichTextBlockLayout.LiftNestedBlocks(html, Resolve);

        var children = Body(output).Children;
        Assert.Equal(new[] { "P", "OL", "UMB-RTE-BLOCK", "P" }, children.Select(c => c.TagName).ToArray());
        Assert.Equal(2, children[1].Children.Length);
        // Still in the exact shape RichTextPropertyConverter splits on.
        Assert.Contains(Block(Table), output);
    }

    [Fact]
    public void Keeps_the_order_of_several_moved_blocks()
    {
        var other = Guid.Parse("88888888-8888-8888-8888-888888888888");
        JsonObject? ResolveTwoTables(Guid key) =>
            key == Table || key == other
                ? new JsonObject { ["componentName"] = "RichText", ["html"] = key.ToString() }
                : null;
        var html = $"<ul><li>{Block(Table)}</li><li>{Block(other)}</li></ul>";

        var output = RichTextBlockLayout.LiftNestedBlocks(html, ResolveTwoTables);

        Assert.True(output.IndexOf(Table.ToString()) < output.IndexOf(other.ToString()));
        Assert.StartsWith("<ul>", output);
    }

    [Fact]
    public void Drops_nested_blocks_that_cannot_be_resolved()
    {
        var html = $"<ul><li>a{Block(Missing)}</li></ul>";

        var output = RichTextBlockLayout.LiftNestedBlocks(html, Resolve);

        Assert.Equal("<ul><li>a</li></ul>", output);
    }

    [Fact]
    public void Leaves_top_level_blocks_in_place_while_fixing_nested_ones()
    {
        var html = $"{Block(Link1)}<ul><li>a{Block(Link2)}</li></ul>{Block(Link1)}";

        var output = RichTextBlockLayout.LiftNestedBlocks(html, Resolve);

        Assert.Equal(2, Count(output, "<umb-rte-block "));
        Assert.StartsWith(Block(Link1), output);
        Assert.EndsWith(Block(Link1), output);
        Assert.Contains(">Lenke 2</a>", output);
    }
}
