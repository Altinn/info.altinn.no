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

        using var scope = _scopeProvider.CreateScope();

        // Checking if path belongs to a page that has been moved and got a new url
        RedirectQueryRow? row = scope.Database.SingleOrDefault<RedirectQueryRow>(
            @"SELECT contentKey as ContentGuid, culture 
                FROM umbracoRedirectUrl WHERE url = @0",
                "1157" + path.Replace("/en/", "/").Replace("/nn/", "/"));     

        // If not, checking if path is added through Skybrud Redirects Add-On
        row ??= scope.Database.SingleOrDefault<RedirectQueryRow>(
                @"SELECT destinationKey as ContentGuid, destinationCulture as Culture 
                    FROM skybrudRedirects WHERE url = @0", path);

        // If not, checking if path is a "Enkel adresse" / umbracoUrlAlias
        row ??= scope.Database.SingleOrDefault<RedirectQueryRow>(
                @"SELECT n.uniqueId as ContentGuid, l.languageISOCode as Culture 
                    FROM umbracoPropertyData pd, cmsPropertyType pt, umbracoNode n, umbracoContentVersion cv, umbracoLanguage l 
                    WHERE pd.propertyTypeId = pt.id
                    AND pt.alias = 'umbracoUrlAlias'
                    AND cv.id = pd.versionId
                    AND cv.""current"" = 1
                    AND pd.languageId = l.id
                    AND n.id = cv.nodeId
                    AND pd.varcharValue = @0", path[1..]);  

        if (row is null)
        {
            return Ok();
        }      

        string resolvedPath = _publishedUrlProvider.GetUrl(row.ContentGuid, culture: row.Culture);

        return "#".Equals(resolvedPath) ? Ok() : Ok(NormalizePath(resolvedPath));
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

        if (path.EndsWith('/'))
        {
            path = path[..(path.Length-1)];
        }

        return path;
    }
    
    private record RedirectQueryRow(
        Guid ContentGuid,
        string Culture);
}
