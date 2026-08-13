using Microsoft.AspNetCore.Mvc;
using Umbraco.Cms.Core.Routing;
using Umbraco.Cms.Infrastructure.Scoping;


[ApiController]
[Route("api/redirect")]
public class RedirectController : ControllerBase
{
    private readonly IPublishedUrlProvider _publishedUrlProvider;
    private readonly IScopeProvider _scopeProvider;

    public RedirectController(IScopeProvider scopeProvider, IPublishedUrlProvider publishedUrlProvider)
    {
        _publishedUrlProvider = publishedUrlProvider;
        _scopeProvider = scopeProvider;
    }

    [HttpGet]
    public IActionResult Get([FromQuery] string path)
    {
        if (string.IsNullOrEmpty(path))
        {
            return Ok();
        }

        path = NormalizePath(path);

        if (path.Length == 1)
        {
            return Ok();
        }

        string pathWithoutTrailingSlash = path[0..(path.Length - 1)];
        string pathWithoutLanguageAndTrailingSlash = pathWithoutTrailingSlash.Replace("/en/", "/").Replace("/nn/", "/");

        using IScope scope = _scopeProvider.CreateScope();

        // Checking if path is added through Skybrud Redirects Add-On.
        // Skybrud stores the inbound url WITHOUT a trailing slash: its own lookup does
        // `path.Trim().TrimEnd('/')` before comparing (RedirectsService.GetRedirectByPathAndQuery),
        // so a trailing slash here never matches. Note NormalizePath() above adds one, because it
        // also normalizes the *outgoing* destination path at the end of this method.
        RedirectQueryRow? row = scope.Database.FirstOrDefault<RedirectQueryRow>(
                @"SELECT destinationKey as ContentGuid, destinationCulture as Culture, destinationUrl as DestinationUrl
                    FROM skybrudRedirects WHERE url = @0", pathWithoutTrailingSlash);

        // If not, checking if path is a "Enkel adresse" / umbracoUrlAlias
        row ??= scope.Database.FirstOrDefault<RedirectQueryRow>(
                @"SELECT n.uniqueId as ContentGuid, l.languageISOCode as Culture 
                    FROM umbracoPropertyData pd, cmsPropertyType pt, umbracoNode n, umbracoContentVersion cv, umbracoLanguage l 
                    WHERE pd.propertyTypeId = pt.id
                    AND pt.alias = 'umbracoUrlAlias'
                    AND cv.id = pd.versionId
                    AND cv.""current"" = 1
                    AND pd.languageId = l.id
                    AND n.id = cv.nodeId
                    AND pd.varcharValue = @0", pathWithoutLanguageAndTrailingSlash[1..]);  

        // If not, checking if path belongs to a page that has been moved and got a new url
        // Putting this one last to allow overrides through Skybrud Redirects and "Enkel adresse"
        row ??= scope.Database.FirstOrDefault<RedirectQueryRow>(
            @"SELECT contentKey as ContentGuid, culture 
                FROM umbracoRedirectUrl WHERE url = @0",
                "1157" + pathWithoutLanguageAndTrailingSlash);     


        if (row is null)
        {
            return Ok();
        }      

        // Content/media destinations carry a key. Resolve it through the url provider rather than
        // trusting skybrudRedirects.destinationUrl, which is only the URL as it looked when the
        // redirect was saved — resolving keeps the redirect pointing at the page if it later moves.
        if (row.ContentGuid != Guid.Empty)
        {
            string resolvedPath = _publishedUrlProvider.GetUrl(row.ContentGuid, culture: row.Culture);

            return "#".Equals(resolvedPath) ? Ok() : Ok(NormalizePath(resolvedPath));
        }

        // A Skybrud redirect whose destination type is "Url" has no destinationKey (Guid.Empty), so
        // there is nothing to resolve — the destination is the raw url the editor typed. Only the
        // Skybrud query selects destinationUrl; the other two always produce a key, so they never
        // reach this branch (their DestinationUrl stays null).
        return string.IsNullOrWhiteSpace(row.DestinationUrl)
            ? Ok()
            : Ok(NormalizeDestinationUrl(row.DestinationUrl));
    }

    /// <summary>
    /// Normalizes a raw destination url from a Skybrud "Url" redirect.
    /// </summary>
    /// <remarks>
    /// Skybrud allows off-site destinations, so an absolute url has to pass through untouched —
    /// <see cref="NormalizePath"/> would turn "https://example.com/foo" into "/https://example.com/foo/".
    /// Relative destinations go through NormalizePath so callers get the same shape as a resolved
    /// content path. Skybrud keeps the destination query string in a separate column, which is
    /// deliberately not forwarded: the Astro caller overwrites the query string with the inbound
    /// request's own, so anything returned here would be discarded.
    /// </remarks>
    private static string NormalizeDestinationUrl(string destinationUrl)
    {
        destinationUrl = destinationUrl.Trim();

        return Uri.TryCreate(destinationUrl, UriKind.Absolute, out _)
            ? destinationUrl
            : NormalizePath(destinationUrl);
    }

    private static string NormalizePath(string path)
    {
        if (path.Contains('?')) {
            path = path[0..path.IndexOf('?')];
        }

        if (!path.StartsWith('/'))
        {
            path = "/" + path;
        }

        if (!path.EndsWith('/'))
        {
            path += "/";
        }

        return path;
    }
    
    // NPoco creates this via the primary constructor with default values and then assigns the
    // properties it finds columns for, so a query that selects no DestinationUrl leaves it null.
    private record RedirectQueryRow(
        Guid ContentGuid,
        string Culture,
        string? DestinationUrl);
}
