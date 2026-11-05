using Infoportal.Cms.Authentication;
using Microsoft.AspNetCore.Http;
using Xunit;

namespace Infoportal.Cms.Tests.Authentication;

public class EntraLoginMessagePageTests
{
    private static string Render(EntraLoginMessagePage.Kind kind)
    {
        var context = new DefaultHttpContext { TraceIdentifier = "TRACE:123" };
        return EntraLoginMessagePage.Render(context, kind);
    }

    [Fact]
    public void Failed_page_shows_error_reference()
    {
        var html = Render(EntraLoginMessagePage.Kind.Failed);

        Assert.Contains("<body class=\"failed\">", html);
        Assert.Contains("<code>TRACE:123</code>", html);
    }

    [Fact]
    public void Cancelled_page_uses_cancelled_class()
    {
        var html = Render(EntraLoginMessagePage.Kind.Cancelled);

        Assert.Contains("<body class=\"cancelled\">", html);
    }

    [Theory]
    [InlineData(EntraLoginMessagePage.Kind.Failed)]
    [InlineData(EntraLoginMessagePage.Kind.Cancelled)]
    public void Replaces_all_placeholders(EntraLoginMessagePage.Kind kind)
    {
        var html = Render(kind);

        // The template comment names the placeholders; the markup itself must be filled in.
        var markup = html[html.IndexOf("-->", StringComparison.Ordinal)..];
        Assert.DoesNotContain("{{", markup);
    }
}
