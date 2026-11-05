using Infoportal.Cms.Authentication;
using Microsoft.AspNetCore.Http;
using Xunit;

namespace Infoportal.Cms.Tests.Authentication;

public class EntraLoginMessagePageTests
{
    private static string Render(string? acceptLanguage, EntraLoginMessagePage.Kind kind = EntraLoginMessagePage.Kind.Failed)
    {
        var context = new DefaultHttpContext { TraceIdentifier = "TRACE:123" };
        if (acceptLanguage is not null)
        {
            context.Request.Headers.AcceptLanguage = acceptLanguage;
        }

        return EntraLoginMessagePage.Render(context, kind);
    }

    [Theory]
    [InlineData("nn-NO,nn;q=0.9", "nn", "Innlogging feila")]
    [InlineData("nb-NO,nb;q=0.9,en;q=0.8", "nb", "Innlogging feilet")]
    [InlineData("no", "nb", "Innlogging feilet")]
    [InlineData("en-GB,en;q=0.9", "en", "Sign-in failed")]
    [InlineData("de-DE,en;q=0.5", "en", "Sign-in failed")]
    [InlineData("de-DE", "nb", "Innlogging feilet")]
    [InlineData(null, "nb", "Innlogging feilet")]
    public void Picks_language_from_accept_language(string? acceptLanguage, string expectedLang, string expectedTitle)
    {
        var html = Render(acceptLanguage);

        Assert.Contains($"<html lang=\"{expectedLang}\">", html);
        Assert.Contains($"<h1>{expectedTitle}</h1>", html);
    }

    [Fact]
    public void Respects_quality_order()
    {
        var html = Render("en;q=0.5,nn;q=0.9");

        Assert.Contains("<html lang=\"nn\">", html);
    }

    [Fact]
    public void Failed_page_shows_error_reference()
    {
        var html = Render("nb", EntraLoginMessagePage.Kind.Failed);

        Assert.Contains("<body class=\"failed\">", html);
        Assert.Contains("<code>TRACE:123</code>", html);
    }

    [Fact]
    public void Cancelled_page_uses_cancelled_texts()
    {
        var html = Render("nb", EntraLoginMessagePage.Kind.Cancelled);

        Assert.Contains("<body class=\"cancelled\">", html);
        Assert.Contains("<h1>Innlogging avbrutt</h1>", html);
    }

    [Theory]
    [InlineData(EntraLoginMessagePage.Kind.Failed)]
    [InlineData(EntraLoginMessagePage.Kind.Cancelled)]
    public void Replaces_all_placeholders(EntraLoginMessagePage.Kind kind)
    {
        var html = Render("en", kind);

        // The template comment mentions {{placeholders}}; everything else must be filled in.
        Assert.DoesNotMatch(@"\{\{(?!placeholders\}\})\w+\}\}", html);
    }
}
