using System.Text.Json.Nodes;
using Infoportal.RichText;
using Xunit;

namespace Infoportal.RichText.Tests;

public class LegacyLinkRewriterTests
{
    private static readonly Guid PageKey = Guid.Parse("cfd06368-21fd-4fa0-8621-6a9665640a0f");
    private static readonly Guid RedirectKey = Guid.Parse("072f021e-17e4-4856-bcf6-0a7e16bbaf36");
    private static readonly Guid MediaKey = Guid.Parse("11111111-2222-3333-4444-555555555555");

    private static LegacyLinkTarget? Resolve(Guid key)
    {
        if (key == PageKey) return new LegacyLinkTarget(PageKey, LegacyLinkTargetType.Document);
        if (key == Guid.Parse("b9dcb0ca-2342-40b7-848e-09831f3bbc26")) return new LegacyLinkTarget(RedirectKey, LegacyLinkTargetType.Document);
        if (key == MediaKey) return new LegacyLinkTarget(MediaKey, LegacyLinkTargetType.Media);
        return null;
    }

    private static string Rewrite(string value, List<LegacyLinkChange>? changes = null) =>
        LegacyLinkRewriter.Rewrite(value, Resolve, changes ?? []);

    [Fact]
    public void Replaces_external_type_with_document()
    {
        var output = Rewrite(@"<p><a href=""~/link/cfd0636821fd4fa086216a9665640a0f.aspx"" type=""external"">Login</a></p>");
        Assert.Equal(@"<p><a href=""/{localLink:cfd06368-21fd-4fa0-8621-6a9665640a0f}"" type=""document"">Login</a></p>", output);
    }

    [Fact]
    public void Adds_type_when_missing()
    {
        var output = Rewrite(@"<a href=""~/link/cfd0636821fd4fa086216a9665640a0f.aspx"">Login</a>");
        Assert.Equal(@"<a href=""/{localLink:cfd06368-21fd-4fa0-8621-6a9665640a0f}"" type=""document"">Login</a>", output);
    }

    [Fact]
    public void Keeps_query_fragment_and_other_attributes()
    {
        var output = Rewrite(@"<a title=""T"" href=""~/link/CFD0636821FD4FA086216A9665640A0F.aspx?id=1&amp;x=2#top"" target=""_blank"" type=""external"">x</a>");
        Assert.Equal(@"<a title=""T"" href=""/{localLink:cfd06368-21fd-4fa0-8621-6a9665640a0f}?id=1&amp;x=2#top"" target=""_blank"" type=""document"">x</a>", output);
    }

    [Fact]
    public void Uses_resolved_key_for_redirected_pages()
    {
        var changes = new List<LegacyLinkChange>();
        var output = Rewrite(@"<a href=""~/link/b9dcb0ca234240b7848e09831f3bbc26.aspx"">x</a>", changes);
        Assert.Contains("/{localLink:072f021e-17e4-4856-bcf6-0a7e16bbaf36}", output);
        Assert.Equal(RedirectKey, Assert.Single(changes).NewKey);
    }

    [Fact]
    public void Uses_media_type_for_media()
    {
        var output = Rewrite(@"<a href=""~/link/11111111222233334444555555555555.aspx"">pdf</a>");
        Assert.Equal(@"<a href=""/{localLink:11111111-2222-3333-4444-555555555555}"" type=""media"">pdf</a>", output);
    }

    [Fact]
    public void Leaves_unresolved_links_and_reports_them()
    {
        var changes = new List<LegacyLinkChange>();
        var input = @"<a href=""~/link/00000000000000000000000000000001.aspx"">x</a>";
        Assert.Equal(input, Rewrite(input, changes));
        Assert.Null(Assert.Single(changes).NewKey);
    }

    [Fact]
    public void Leaves_other_links_untouched()
    {
        var input = @"<a href=""https://example.com/link/a.aspx"">x</a><a href=""/{localLink:cfd06368-21fd-4fa0-8621-6a9665640a0f}"" type=""document"">y</a>";
        Assert.Same(input, Rewrite(input));
    }

    [Fact]
    public void Rewrites_markup_nested_in_json()
    {
        var input = """{"markup":"<p><a href=\"~/link/cfd0636821fd4fa086216a9665640a0f.aspx\" type=\"external\">x</a></p>","blocks":{"contentData":[{"values":[{"alias":"text","value":{"markup":"<a href=\"~/link/cfd0636821fd4fa086216a9665640a0f.aspx\">y</a>"}}]}]}}""";
        var changes = new List<LegacyLinkChange>();
        var output = JsonNode.Parse(Rewrite(input, changes))!;

        Assert.Equal(2, changes.Count);
        Assert.Equal(
            "<p><a href=\"/{localLink:cfd06368-21fd-4fa0-8621-6a9665640a0f}\" type=\"document\">x</a></p>",
            output["markup"]!.GetValue<string>());
        Assert.Equal(
            "<a href=\"/{localLink:cfd06368-21fd-4fa0-8621-6a9665640a0f}\" type=\"document\">y</a>",
            output["blocks"]!["contentData"]![0]!["values"]![0]!["value"]!["markup"]!.GetValue<string>());
    }

    [Fact]
    public void Rewrites_json_encoded_inside_json_string()
    {
        var inner = """{"markup":"<a href=\"~/link/cfd0636821fd4fa086216a9665640a0f.aspx\">y</a>"}""";
        var input = new JsonObject { ["value"] = inner }.ToJsonString();
        var output = JsonNode.Parse(Rewrite(input))!["value"]!.GetValue<string>();
        Assert.Contains("/{localLink:cfd06368-21fd-4fa0-8621-6a9665640a0f}", output);
    }
}
