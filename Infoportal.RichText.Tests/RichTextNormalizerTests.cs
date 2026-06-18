using System.Text.RegularExpressions;
using Infoportal.RichText;
using Xunit;

namespace Infoportal.RichText.Tests;

public class RichTextNormalizerTests
{
    private static int Count(string html, string pattern) =>
        Regex.Matches(html, pattern, RegexOptions.IgnoreCase).Count;

    // --- collapseConsecutiveBreaks (#4) ---

    [Fact]
    public void Collapses_double_br_into_single()
    {
        var output = RichTextNormalizer.Normalize("<p>a</p><br><br><p>b</p>");
        Assert.Equal(1, Count(output, "<br"));
    }

    [Fact]
    public void Collapses_br_run_ignoring_whitespace_between()
    {
        var output = RichTextNormalizer.Normalize("a<br>\n<br> <br>b");
        Assert.Equal(1, Count(output, "<br"));
    }

    [Fact]
    public void Leaves_single_br_untouched()
    {
        var output = RichTextNormalizer.Normalize("a<br>b");
        Assert.Equal(1, Count(output, "<br"));
    }

    // --- wrapLooseLinkRuns (#2) ---

    [Fact]
    public void Wraps_br_separated_links_in_single_ul_with_one_li_each()
    {
        var output = RichTextNormalizer.Normalize(
            "<a href=\"/x\">X</a><br><a href=\"/y\">Y</a>");
        Assert.Equal(1, Count(output, "<ul"));
        Assert.Equal(2, Count(output, "<li"));
        Assert.Contains(">X</a>", output);
        Assert.Contains(">Y</a>", output);
        Assert.DoesNotContain("<br", output);
    }

    [Fact]
    public void Wraps_run_of_three_loose_links()
    {
        var output = RichTextNormalizer.Normalize(
            "<a href=\"/x\">X</a><br><a href=\"/y\">Y</a><br><a href=\"/z\">Z</a>");
        Assert.Equal(1, Count(output, "<ul"));
        Assert.Equal(3, Count(output, "<li"));
    }

    [Fact]
    public void Does_not_wrap_a_single_link()
    {
        var output = RichTextNormalizer.Normalize("<a href=\"/x\">X</a>");
        Assert.DoesNotContain("<ul", output);
    }

    [Fact]
    public void Does_not_wrap_inline_links_separated_by_text_in_paragraph()
    {
        var output = RichTextNormalizer.Normalize(
            "<p>see <a href=\"/x\">X</a> and <a href=\"/y\">Y</a></p>");
        Assert.DoesNotContain("<ul", output);
    }

    [Fact]
    public void Does_not_produce_invalid_ul_inside_paragraph()
    {
        var output = RichTextNormalizer.Normalize(
            "<p><a href=\"/x\">X</a><br><a href=\"/y\">Y</a></p>");
        Assert.DoesNotContain("<ul", output);
    }

    [Fact]
    public void Leaves_existing_link_list_intact()
    {
        var output = RichTextNormalizer.Normalize(
            "<ul><li><a href=\"/x\">X</a></li><li><a href=\"/y\">Y</a></li></ul>");
        Assert.Equal(1, Count(output, "<ul"));
        Assert.Equal(2, Count(output, "<li"));
    }

    [Fact]
    public void Empty_or_null_input_is_safe()
    {
        Assert.Equal(string.Empty, RichTextNormalizer.Normalize(null));
        Assert.Equal(string.Empty, RichTextNormalizer.Normalize(""));
    }

    [Fact]
    public void Leaves_content_without_breaks_or_link_runs_byte_for_byte()
    {
        // No <br> and fewer than 2 links: must be returned verbatim, i.e. the
        // DOM round-trip is skipped so unrelated markup isn't reserialised.
        const string input = "<p><img src=\"a.jpg\" /> hello <b>world</b></p>";
        Assert.Equal(input, RichTextNormalizer.Normalize(input));
    }

    // --- empty links (#533) ---

    [Fact]
    public void Removes_a_truly_empty_link_word_artifact()
    {
        var output = RichTextNormalizer.Normalize(
            "<p>x</p><a id=\"_anchor_7\" href=\"#_msocom_7\"></a>");
        Assert.DoesNotContain("<a", output);
    }

    [Fact]
    public void Unwraps_a_link_that_contains_only_a_break()
    {
        var output = RichTextNormalizer.Normalize("<a href=\"/x\"><br></a>");
        Assert.DoesNotContain("<a", output);
        Assert.Contains("<br", output);
    }

    [Fact]
    public void Keeps_a_link_that_has_text()
    {
        const string input = "<p>See <a href=\"/x\">link</a></p>";
        var output = RichTextNormalizer.Normalize(input);
        Assert.Contains(">link</a>", output);
        // single link with text: nothing to do, returned verbatim
        Assert.Equal(input, output);
    }

    [Fact]
    public void Keeps_an_image_link_with_alt_text()
    {
        var output = RichTextNormalizer.Normalize(
            "<a href=\"/x\"><img src=\"i.png\" alt=\"desc\"></a>");
        Assert.Contains("<a", output);
    }
}
