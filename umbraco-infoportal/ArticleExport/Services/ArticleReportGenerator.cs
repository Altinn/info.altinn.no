using System.Net;
using System.Text;
using System.Text.Json.Nodes;
using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using HtmlAgilityPack;
using umbraco_infoportal.ArticleExport.Models;
using Umbraco.Cms.Core.Models.Blocks;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.PublishedCache;
using Umbraco.Cms.Core.Scoping;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Web;
using Umbraco.Cms.Web.Common;
using Umbraco.Extensions;

namespace umbraco_infoportal.ArticleExport.Services;

// Faithful port of the Optimizely ArticleGenerateReportController logic onto the
// Umbraco 17 content model. Selects published article/schema/subsidy pages by
// provider/author/language/date, renders them to an HTML table, and packages the
// result as a Word .docx via an AltChunk (Word converts the embedded HTML on open).
public sealed class ArticleReportGenerator(
    UmbracoHelper umbracoHelper,
    IUmbracoContextFactory umbracoContextFactory,
    ICoreScopeProvider coreScopeProvider,
    IDocumentCacheService documentCacheService,
    IPublishedContentTypeCache publishedContentTypeCache,
    IPublishedValueFallback publishedValueFallback,
    ILanguageService languageService)
{
    private const string DocxMime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    private const string StartPageAlias = "startPage";
    private const string SchemaPageAlias = "schemaPage";
    private const string SubsidyPageAlias = "subsidyPage";
    private const string ProviderPageAlias = "providerPage";

    private static readonly string[] ExportPageAliases =
    [
        "newsArticlePage",
        "sectionArticlePage",
        "articlePage",
        SchemaPageAlias,
        SubsidyPageAlias,
    ];

    // Tjenesteeier (agency): contentOwner picker (Innholdseiere) on article/subsidy types +
    // the legacy schemaPage `providers` picker (providerPage) + subsidy `agency` free text.
    private const string ContentOwnersAlias = "contentOwners";   // article/subsidy picker → contentOwner
    private const string ContentOwnerAlias = "contentOwner";     // agency nodes (dropdown source)
    private const string ProvidersAlias = "providers";           // schemaPage picker → providerPage
    private const string AgencyAlias = "agency";                 // subsidyPage — string
    // Koordinator (author): subjectMatterExpert picker (Fageksperter) + subsidy `coordinator` free text.
    private const string SubjectExpertsAlias = "subjectMatterExperts"; // article/subsidy picker → subjectMatterExpert
    private const string SubjectExpertAlias = "subjectMatterExpert";    // expert nodes (dropdown source)
    private const string CoordinatorAlias = "coordinator";       // subsidyPage — string
    private const string LastChangedAlias = "lastChanged";
    private const string MainIntroAlias = "mainIntro";
    private const string MainBodyAlias = "mainBody";
    private const string AccordianListAlias = "accordianList";
    private const string HeadingAlias = "heading";
    private const string TranslatedHeadingAlias = "translatedHeading";
    private const string DescriptionAlias = "description";

    // Resolves a request's language to a concrete enabled ISO code. Empty/blank input
    // falls back to the default language; an unknown non-blank code returns null so the
    // controller can reject it with 400.
    public async Task<string?> ResolveCultureAsync(string? language)
    {
        IEnumerable<Umbraco.Cms.Core.Models.ILanguage> all = await languageService.GetAllAsync();
        List<Umbraco.Cms.Core.Models.ILanguage> languages = all.ToList();

        if (!string.IsNullOrWhiteSpace(language))
        {
            return languages
                .FirstOrDefault(l => l.IsoCode.Equals(language, StringComparison.OrdinalIgnoreCase))
                ?.IsoCode;
        }

        return (languages.FirstOrDefault(l => l.IsDefault) ?? languages.FirstOrDefault())?.IsoCode;
    }

    public async Task<FilterOptionsResponse> GetFilterOptionsAsync(string culture, CancellationToken cancellationToken)
    {
        var providers = new SortedSet<string>(StringComparer.OrdinalIgnoreCase);
        var authors = new SortedSet<string>(StringComparer.OrdinalIgnoreCase);

        // Reading published content via the HybridCache needs an UmbracoContext + an ambient
        // scope; a backoffice Management API request does not open one automatically.
        using (umbracoContextFactory.EnsureUmbracoContext())
        using (coreScopeProvider.CreateCoreScope(autoComplete: true))
        {
            // Tjenesteeier list = the Innholdseiere (contentOwner) tree + the legacy schema
            // providerPage tree, so the dropdown lists every agency like Optimizely's category.
            AddNodeNames(ContentOwnerAlias, culture, providers, cancellationToken);
            AddNodeNames(ProviderPageAlias, culture, providers, cancellationToken);

            // Koordinator list = the Fageksperter (subjectMatterExpert) tree.
            AddNodeNames(SubjectExpertAlias, culture, authors, cancellationToken);

            // Subsidy also carries agency/coordinator as free text — fold those in.
            foreach (IPublishedContent page in GetByType(SubsidyPageAlias, culture))
            {
                cancellationToken.ThrowIfCancellationRequested();
                foreach (string provider in GetProviderNames(page, culture))
                {
                    providers.Add(provider);
                }

                foreach (string author in GetAuthorNames(page, culture))
                {
                    authors.Add(author);
                }
            }
        }

        List<LanguageOption> languages = (await languageService.GetAllAsync())
            .Select(l => new LanguageOption(l.IsoCode, l.CultureName))
            .ToList();

        return new FilterOptionsResponse(providers.ToList(), authors.ToList(), languages);
    }

    public async Task<ArticleReport> BuildReportAsync(ExportFilters filters, string culture, CancellationToken cancellationToken)
    {
        string? provider = NormalizeFilter(filters.Provider);
        string? author = NormalizeFilter(filters.Author);

        var selected = new List<IPublishedContent>();
        string html;

        // Reading published content + generating page URLs needs an UmbracoContext + an ambient
        // scope; a backoffice Management API request does not open one automatically.
        using (umbracoContextFactory.EnsureUmbracoContext())
        using (coreScopeProvider.CreateCoreScope(autoComplete: true))
        {
            foreach (IPublishedContent page in GetExportPages(culture))
            {
                cancellationToken.ThrowIfCancellationRequested();
                if (Matches(page, filters, provider, author, culture))
                {
                    selected.Add(page);
                }
            }

            // Optimizely emits pages in content-tree order (GetDescendents). Our content-type
            // index returns them grouped by type, so re-order on the tree path to restore the
            // depth-first, structure-based order Optimizely produces.
            selected = selected.OrderBy(TreeOrderKey, StringComparer.Ordinal).ToList();
            html = BuildHtml(selected, culture, GetStartPage(culture));
        }

        byte[] bytes = await HtmlToDocxAsync(html);
        return new ArticleReport(bytes, BuildFileName(filters, culture), selected.Count);
    }

    // Mirrors the legacy four-case combine: both / provider-only / author-only / neither.
    private bool Matches(IPublishedContent page, ExportFilters filters, string? provider, string? author, string culture)
    {
        DateTime changed = GetChangedDate(page, culture);
        if (filters.FromDate is { } from && changed < from)
        {
            return false;
        }

        if (filters.ToDate is { } to && changed > to)
        {
            return false;
        }

        bool matchesProvider = provider is not null
            && GetProviderNames(page, culture).Contains(provider, StringComparer.OrdinalIgnoreCase);
        bool matchesAuthor = author is not null
            && GetAuthorNames(page, culture).Contains(author, StringComparer.OrdinalIgnoreCase);

        return (provider, author) switch
        {
            (not null, not null) => matchesProvider && matchesAuthor,
            (not null, null) => matchesProvider,
            (null, not null) => matchesAuthor,
            (null, null) => true,
        };
    }

    public static string DocxContentType => DocxMime;

    private IPublishedContent? GetStartPage(string culture)
    {
        IEnumerable<IPublishedContent> roots = umbracoHelper.ContentAtRoot();
        return roots.FirstOrDefault(x =>
                   x.ContentType.Alias.Equals(StartPageAlias, StringComparison.OrdinalIgnoreCase)
                   && (string.IsNullOrEmpty(culture) || x.Cultures.ContainsKey(culture)))
               ?? roots.FirstOrDefault(x => x.ContentType.Alias.Equals(StartPageAlias, StringComparison.OrdinalIgnoreCase));
    }

    private IEnumerable<IPublishedContent> GetExportPages(string culture) =>
        ExportPageAliases.SelectMany(alias => GetByType(alias, culture));

    // Pulls published content of a single type straight from the content-type index
    // instead of recursively walking the whole tree (much faster on a large site).
    private List<IPublishedContent> GetByType(string alias, string culture)
    {
        IPublishedContentType? type = publishedContentTypeCache.Get(PublishedItemType.Content, alias);
        if (type is null)
        {
            return [];
        }

        // Materialize the cache query FIRST: per-item property/picker resolution (e.g. a
        // Multi-Node Tree Picker) opens its own DataReader on the same scoped connection, and
        // there is no MARS — a still-open enumeration reader collides ("already an open
        // DataReader"). Filtering by culture happens after the reader is closed.
        List<IPublishedContent> pages = documentCacheService.GetByContentType(type).ToList();
        return pages.Where(page => IsAvailableInCulture(page, culture)).ToList();
    }

    private static bool IsAvailableInCulture(IPublishedContent page, string culture) =>
        string.IsNullOrEmpty(culture)
        || !page.ContentType.Variations.VariesByCulture()
        || page.Cultures.ContainsKey(culture);

    private static bool IsSchema(IPublishedContent page) =>
        page.ContentType.Alias.Equals(SchemaPageAlias, StringComparison.OrdinalIgnoreCase);

    private DateTime GetChangedDate(IPublishedContent page, string culture)
    {
        if (page.HasProperty(LastChangedAlias))
        {
            DateTime? lastChanged = page.Value<DateTime?>(publishedValueFallback, LastChangedAlias, culture);
            if (lastChanged is { } value && value != default)
            {
                return value;
            }
        }

        return page.Cultures.TryGetValue(culture, out PublishedCultureInfo? info) ? info.Date : page.UpdateDate;
    }

    private IEnumerable<string> GetProviderNames(IPublishedContent page, string culture)
    {
        // contentOwner (Innholdseiere) on article/subsidy types + legacy schema providerPage picker.
        foreach (string name in GetPickerNames(page, culture, ContentOwnersAlias, ProvidersAlias))
        {
            yield return name;
        }

        // Subsidy free-text agency.
        if (page.HasProperty(AgencyAlias))
        {
            foreach (string value in SplitValues(page.Value<string>(publishedValueFallback, AgencyAlias, culture)))
            {
                yield return value;
            }
        }
    }

    private IEnumerable<string> GetAuthorNames(IPublishedContent page, string culture)
    {
        // subjectMatterExpert (Fageksperter) picker on article/subsidy types.
        foreach (string name in GetPickerNames(page, culture, SubjectExpertsAlias))
        {
            yield return name;
        }

        // Legacy subsidy free-text coordinator.
        if (page.HasProperty(CoordinatorAlias))
        {
            foreach (string value in SplitValues(page.Value<string>(publishedValueFallback, CoordinatorAlias, culture)))
            {
                yield return value;
            }
        }
    }

    // Reads one or more Content/Multi-Node Tree Picker properties and yields the referenced
    // nodes' names. Missing properties are skipped (safe before the content model exists).
    private IEnumerable<string> GetPickerNames(IPublishedContent page, string culture, params string[] aliases)
    {
        foreach (string alias in aliases)
        {
            if (!page.HasProperty(alias))
            {
                continue;
            }

            IEnumerable<IPublishedContent>? refs =
                page.Value<IEnumerable<IPublishedContent>>(publishedValueFallback, alias, culture);
            if (refs is null)
            {
                continue;
            }

            foreach (IPublishedContent node in refs)
            {
                if (!string.IsNullOrWhiteSpace(node?.Name))
                {
                    yield return node.Name.Trim();
                }
            }
        }
    }

    // Adds every node name of a content type (the Innholdseiere / Fageksperter trees) to a
    // dropdown set, so the filter lists the full taxonomy like Optimizely's category.
    private void AddNodeNames(string typeAlias, string culture, ISet<string> target, CancellationToken cancellationToken)
    {
        foreach (IPublishedContent node in GetByType(typeAlias, culture))
        {
            cancellationToken.ThrowIfCancellationRequested();
            if (!string.IsNullOrWhiteSpace(node.Name))
            {
                target.Add(node.Name.Trim());
            }
        }
    }

    private IEnumerable<string> GetCategoryNames(IPublishedContent page, string culture) =>
        GetProviderNames(page, culture).Concat(GetAuthorNames(page, culture));

    private static IEnumerable<string> SplitValues(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            yield break;
        }

        foreach (string part in value.Split([',', ';'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            yield return part;
        }
    }

    private static string? NormalizeFilter(string? value)
    {
        // The dashboard sends "" for the "Alle" (no-filter) option, so ONLY empty means no
        // filter. Do not also treat the literal "Alle"/"ALLE" as no-filter: there is a real
        // Tjenesteeier node named "ALLE", and a case-insensitive match silently disabled the
        // filter (returning all 2109 pages instead of the ALLE-tagged subset). Optimizely
        // compared "Alle" case-sensitively for exactly this reason.
        string? trimmed = value?.Trim();
        return string.IsNullOrEmpty(trimmed) ? null : trimmed;
    }

    // A lexically-sortable key from the content path ("-1,1050,2109") with each id zero-padded,
    // so OrderBy yields content-tree (depth-first) order rather than content-type-grouped order.
    private static string TreeOrderKey(IPublishedContent page) =>
        string.Join(",", page.Path.Split(',').Select(s => int.TryParse(s, out int id) ? id.ToString("D10") : s));

    private string BuildHtml(IReadOnlyList<IPublishedContent> pages, string culture, IPublishedContent? start)
    {
        string? publicBase = GetPublicBase(start, culture);

        var sb = new StringBuilder();
        sb.Append("<html><head><title></title><style>a{color:blue;}</style></head><body>");
        sb.Append("<table style='border:1px solid #000000;border-collapse:collapse'>");
        sb.Append("<tr><th style='border:1px solid #000000;'>Eier(e)</th><th style='border:1px solid #000000;'>Innhold</th></tr>");

        foreach (IPublishedContent page in pages)
        {
            string owner = string.Join(", ", GetCategoryNames(page, culture));
            string url = page.Url(culture, UrlMode.Absolute);

            sb.Append("<tr>");
            sb.Append("<td style='border:1px solid #000000;vertical-align:top;'>")
              .Append(WebUtility.HtmlEncode(string.IsNullOrEmpty(owner) ? "Coordinator" : owner))
              .Append("</td>");
            sb.Append("<td style='border:1px solid #000000;padding-left:25px;'>");
            sb.Append("<h2><a href='").Append(WebUtility.HtmlEncode(url)).Append("'>")
              .Append(WebUtility.HtmlEncode(page.Name)).Append("</a></h2>");

            if (IsSchema(page))
            {
                AppendSchemaBody(sb, page, culture);
            }
            else
            {
                AppendArticleBody(sb, page, culture);
            }

            sb.Append("</td></tr>");
        }

        sb.Append("</table></body></html>");

        string html = AbsolutizeUrls(sb.ToString(), publicBase);
        return PreMailer.Net.PreMailer.MoveCssInline(html).Html;
    }

    private void AppendArticleBody(StringBuilder sb, IPublishedContent page, string culture)
    {
        string intro = GetRichTextHtml(page, MainIntroAlias, culture);
        if (!string.IsNullOrWhiteSpace(intro))
        {
            sb.Append("<p><b>").Append(intro).Append("</b></p>");
        }

        string body = GetRichTextHtml(page, MainBodyAlias, culture);
        if (!string.IsNullOrWhiteSpace(body))
        {
            sb.Append("<p>").Append(body).Append("</p>");
        }
    }

    private void AppendSchemaBody(StringBuilder sb, IPublishedContent page, string culture)
    {
        string intro = GetRichTextHtml(page, MainIntroAlias, culture);
        if (!string.IsNullOrWhiteSpace(intro))
        {
            sb.Append("<p><b>").Append(intro).Append("</b></p>");
        }

        BlockListModel? accordions = page.HasProperty(AccordianListAlias)
            ? page.Value<BlockListModel>(publishedValueFallback, AccordianListAlias, culture)
            : null;
        if (accordions is not { Count: > 0 })
        {
            return;
        }

        sb.Append("<h2>").Append(WebUtility.HtmlEncode(SchemaAccordionLabels.AboutHeading(culture))).Append("</h2>");

        foreach (BlockListItem item in accordions)
        {
            IPublishedElement content = item.Content;
            string? translatedKey = content.Value<string>(publishedValueFallback, TranslatedHeadingAlias, culture);
            string? heading = SchemaAccordionLabels.TranslateHeading(translatedKey, culture)
                ?? content.Value<string>(publishedValueFallback, HeadingAlias, culture);
            if (!string.IsNullOrWhiteSpace(heading))
            {
                sb.Append("<h3>").Append(WebUtility.HtmlEncode(heading)).Append("</h3>");
            }

            string description = GetRichTextHtml(content, DescriptionAlias, culture);
            if (!string.IsNullOrWhiteSpace(description))
            {
                sb.Append(description);
            }
        }
    }

    // RichText is stored as a JsonObject ({ items: [{ html, componentName }] }) by this repo's
    // RichTextPropertyConverter, so Value<string> returns null and would silently drop the body.
    // Read the JsonObject and concatenate the already-resolved item HTML (localLinks/media already
    // filtered); fall back to Value<string> for plain-text properties (e.g. article mainIntro).
    // Accepts IPublishedElement so it works for both pages and block elements (accordion items).
    private string GetRichTextHtml(IPublishedElement content, string alias, string culture)
    {
        if (!content.HasProperty(alias))
        {
            return string.Empty;
        }

        JsonObject? json = content.Value<JsonObject>(publishedValueFallback, alias, culture);
        if (json is null)
        {
            return content.Value<string>(publishedValueFallback, alias, culture) ?? string.Empty;
        }

        if (json["items"] is not JsonArray items)
        {
            return string.Empty;
        }

        var sb = new StringBuilder();
        foreach (JsonNode? item in items)
        {
            string? html = item?["html"]?.GetValue<string>();
            if (!string.IsNullOrWhiteSpace(html))
            {
                sb.Append(html);
            }
        }

        return sb.ToString();
    }

    private static string? GetPublicBase(IPublishedContent? start, string culture)
    {
        string? absolute = start?.Url(culture, UrlMode.Absolute);
        return Uri.TryCreate(absolute, UriKind.Absolute, out Uri? uri) ? uri.GetLeftPart(UriPartial.Authority) : null;
    }

    // Rewrites relative href/src to absolute against the public site base (NOT the
    // backoffice request) so links and images resolve when the document is opened.
    private static string AbsolutizeUrls(string html, string? publicBase)
    {
        if (string.IsNullOrEmpty(publicBase) || !Uri.TryCreate(publicBase, UriKind.Absolute, out Uri? baseUri))
        {
            return html;
        }

        var doc = new HtmlDocument();
        doc.LoadHtml(html);

        foreach (HtmlNode node in doc.DocumentNode.Descendants().Where(n => n.Name is "a" or "img" or "link"))
        {
            string attribute = node.Name == "img" ? "src" : "href";
            string value = node.GetAttributeValue(attribute, string.Empty);
            if (!string.IsNullOrEmpty(value) && Uri.TryCreate(baseUri, value, out Uri? absolute))
            {
                node.SetAttributeValue(attribute, absolute.AbsoluteUri);
            }
        }

        using var writer = new StringWriter();
        doc.Save(writer);
        return writer.ToString();
    }

    // Converts the HTML into NATIVE Word elements via HtmlToOpenXml (the same library the
    // Optimizely report used) so the .docx carries a real table + styles, instead of an
    // AltChunk that Word must convert on open. Mirrors the legacy heading cleanup so the
    // converter doesn't choke on empty or digit-leading headings.
    private static async Task<byte[]> HtmlToDocxAsync(string html)
    {
        var document = new HtmlDocument();
        document.LoadHtml(html);
        RemoveEmptyNodes(document.DocumentNode);
        AddInvisibleCharacter(document.DocumentNode);
        string cleaned = document.DocumentNode.OuterHtml;

        using var ms = new MemoryStream();
        using (WordprocessingDocument package = WordprocessingDocument.Create(ms, WordprocessingDocumentType.Document))
        {
            MainDocumentPart mainPart = package.AddMainDocumentPart();
            mainPart.Document = new Document(new Body());

            var converter = new HtmlToOpenXml.HtmlConverter(mainPart);
            await converter.ParseBody(cleaned);

            mainPart.Document.Save();
        }

        return ms.ToArray();
    }

    // HtmlToOpenXml crashes converting empty headings/anchors; drop them first (legacy workaround).
    private static void RemoveEmptyNodes(HtmlNode containerNode)
    {
        var nodesToRemove = new HashSet<string> { "a", "h1", "h2", "h3", "h4", "h5", "h6", "p" };
        if (nodesToRemove.Contains(containerNode.Name) && string.IsNullOrEmpty(containerNode.InnerText))
        {
            containerNode.Remove();
            return;
        }

        for (int i = containerNode.ChildNodes.Count - 1; i >= 0; i--)
        {
            RemoveEmptyNodes(containerNode.ChildNodes[i]);
        }
    }

    // HtmlToOpenXml mishandles headings that start with a digit; NBSP-prefix them (legacy workaround).
    private static void AddInvisibleCharacter(HtmlNode containerNode)
    {
        var headingTags = new HashSet<string> { "h1", "h2", "h3", "h4", "h5", "h6" };
        if (headingTags.Contains(containerNode.Name)
            && !string.IsNullOrEmpty(containerNode.InnerText)
            && char.IsDigit(containerNode.InnerText[0]))
        {
            containerNode.ParentNode.ReplaceChild(
                HtmlNode.CreateNode("<h2> " + containerNode.InnerText + "</h2>"), containerNode);
            return;
        }

        for (int i = containerNode.ChildNodes.Count - 1; i >= 0; i--)
        {
            AddInvisibleCharacter(containerNode.ChildNodes[i]);
        }
    }

    private static string BuildFileName(ExportFilters filters, string culture)
    {
        // Mirror Optimizely's "Provider-Author-Language" name; blank filters read as "Alle" and a
        // blank language falls back to the resolved culture (e.g. "Articles ALLE-Alle-nb.docx").
        string provider = string.IsNullOrWhiteSpace(filters.Provider) ? "Alle" : filters.Provider;
        string author = string.IsNullOrWhiteSpace(filters.Author) ? "Alle" : filters.Author;
        string language = string.IsNullOrWhiteSpace(filters.Language) ? culture : filters.Language;
        return $"Articles {Sanitize($"{provider}-{author}-{language}")}.docx";
    }

    // Strips CR/LF, other control chars, and path-invalid characters so the value is
    // safe inside the Content-Disposition header; File() applies RFC 6266 encoding for
    // any remaining non-ASCII characters.
    private static string Sanitize(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        char[] invalid = Path.GetInvalidFileNameChars();
        string cleaned = new([.. value.Where(c => !char.IsControl(c) && !invalid.Contains(c))]);
        cleaned = cleaned.Trim();
        return cleaned.Length > 80 ? cleaned[..80] : cleaned;
    }
}
