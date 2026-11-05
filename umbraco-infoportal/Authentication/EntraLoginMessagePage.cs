using System.Text.Encodings.Web;
using Microsoft.Net.Http.Headers;

namespace Infoportal.Cms.Authentication;

/// <summary>
/// Renders the standalone page shown when a Microsoft Entra ID backoffice login is cancelled or fails.
/// The markup lives in EntraLoginMessagePage.html (embedded resource). The user is not logged in at
/// this point, so the language is taken from the browser's Accept-Language header (bokmål, nynorsk
/// or English, falling back to bokmål).
/// </summary>
public static class EntraLoginMessagePage
{
    public enum Kind
    {
        Cancelled,
        Failed,
    }

    private const string ResourceName = "Infoportal.Cms.Authentication.EntraLoginMessagePage.html";

    private static readonly Lazy<string> Template = new(LoadTemplate);

    private sealed record Texts(
        string Lang,
        string CancelledTitle,
        string CancelledText,
        string FailedTitle,
        string FailedText,
        string ErrorReference,
        string TryAgain);

    private static readonly Texts Bokmal = new(
        Lang: "nb",
        CancelledTitle: "Innlogging avbrutt",
        CancelledText: "Innloggingen med Microsoft ble avbrutt.",
        FailedTitle: "Innlogging feilet",
        FailedText: "Vi klarte ikke å logge deg inn med Microsoft. Prøv igjen om litt. " +
                    "Hvis feilen vedvarer, kontakt en administrator og oppgi feilreferansen under.",
        ErrorReference: "Feilreferanse",
        TryAgain: "Prøv igjen");

    private static readonly Texts Nynorsk = new(
        Lang: "nn",
        CancelledTitle: "Innlogging avbroten",
        CancelledText: "Innlogginga med Microsoft vart avbroten.",
        FailedTitle: "Innlogging feila",
        FailedText: "Vi klarte ikkje å logge deg inn med Microsoft. Prøv igjen om litt. " +
                    "Viss feilen held fram, kontakt ein administrator og oppgi feilreferansen under.",
        ErrorReference: "Feilreferanse",
        TryAgain: "Prøv igjen");

    private static readonly Texts English = new(
        Lang: "en",
        CancelledTitle: "Sign-in cancelled",
        CancelledText: "Signing in with Microsoft was cancelled.",
        FailedTitle: "Sign-in failed",
        FailedText: "We couldn't sign you in with Microsoft. Please try again in a moment. " +
                    "If the problem persists, contact an administrator and include the error reference below.",
        ErrorReference: "Error reference",
        TryAgain: "Try again");

    public static Task WriteAsync(HttpContext context, Kind kind)
    {
        var response = context.Response;
        response.StatusCode = kind == Kind.Failed
            ? StatusCodes.Status500InternalServerError
            : StatusCodes.Status200OK;
        response.ContentType = "text/html; charset=utf-8";
        response.Headers.CacheControl = "no-store";
        response.Headers.Vary = HeaderNames.AcceptLanguage;

        return response.WriteAsync(Render(context, kind));
    }

    public static string Render(HttpContext context, Kind kind)
    {
        var texts = ResolveTexts(context.Request);
        var failed = kind == Kind.Failed;
        var html = HtmlEncoder.Default;

        return Template.Value
            .Replace("{{lang}}", texts.Lang)
            .Replace("{{kind}}", failed ? "failed" : "cancelled")
            .Replace("{{title}}", html.Encode(failed ? texts.FailedTitle : texts.CancelledTitle))
            .Replace("{{text}}", html.Encode(failed ? texts.FailedText : texts.CancelledText))
            .Replace("{{errorReference}}", html.Encode(texts.ErrorReference))
            .Replace("{{traceId}}", html.Encode(context.TraceIdentifier))
            .Replace("{{tryAgain}}", html.Encode(texts.TryAgain));
    }

    private static Texts ResolveTexts(HttpRequest request)
    {
        var languages = request.GetTypedHeaders().AcceptLanguage
            .Where(l => l.Quality is null or > 0)
            .OrderByDescending(l => l.Quality ?? 1);

        foreach (var language in languages)
        {
            var primary = language.Value.Value?.Split('-')[0].ToLowerInvariant();
            switch (primary)
            {
                case "nn":
                    return Nynorsk;
                case "nb" or "no":
                    return Bokmal;
                case "en":
                    return English;
            }
        }

        return Bokmal;
    }

    private static string LoadTemplate()
    {
        using var stream = typeof(EntraLoginMessagePage).Assembly.GetManifestResourceStream(ResourceName)
            ?? throw new InvalidOperationException(
                $"Embedded resource not found: {ResourceName}. " +
                "Ensure the file is included as <EmbeddedResource> in the .csproj.");

        using var reader = new StreamReader(stream);
        return reader.ReadToEnd();
    }
}
