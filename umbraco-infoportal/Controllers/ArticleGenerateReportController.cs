using System.Globalization;
using System.Net;
using System.Text;
using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using HtmlAgilityPack;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Mvc;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Models.Blocks;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Web.Common;

namespace umbraco_infoportal.Controllers
{
    [Authorize(Roles = "Administrators, WebAdmins, CmsAdmins")]
    public class ArticleGenerateReportController(
            UmbracoHelper umbracoHelper,
            IPublishedValueFallback publishedValueFallback,
            ILanguageService languageService,
            ILocalizedTextService localizedTextService)
        : Controller
    {
        private const string AllOption = "Alle";
        private const string StartPageAlias = "startPage";
        private const string NewsArticlePageAlias = "newsArticlePage";
        private const string SectionArticlePageAlias = "sectionArticlePage";
        private const string SchemaPageAlias = "schemaPage";
        private const string MainIntroAlias = "mainIntro";
        private const string MainBodyAlias = "mainBody";
        private const string AccordianListAlias = "accordianList";
        private const string AccordionListAlias = "accordionList";
        private const string HeadingAlias = "heading";
        private const string TranslatedHeadingAlias = "translatedHeading";
        private const string DescriptionAlias = "description";

        private static readonly string[] ArticlePageAliases =
        [
            NewsArticlePageAlias,
            SectionArticlePageAlias,
            SchemaPageAlias
        ];

        // These replace the old Optimizely CategoryRepository roots. Adjust the
        // aliases if the migrated provider/author properties use different names.
        private static readonly string[] ProviderAliases =
        [
            "provider",
            "providers",
            "agency",
            "agencies",
            "owner",
            "owners",
            "contentOwner",
            "contentOwners"
        ];

        private static readonly string[] AuthorAliases =
        [
            "author",
            "authors",
            "coordinator",
            "coordinators",
            "responsible",
            "responsibleEntity"
        ];

        protected int errors = 0;

        public async Task<ActionResult> Index()
        {
            var model = new ArticleGenerateReportViewModel();
            var start = GetStartPage(null);
            var articles = start is null ? [] : GetDescendents(start, null).Where(IsArticlePage).ToList();

            //Må sjekke oppimot categories implementasjon i Umbraco
            if (start != null)
            {
                model.Providers = GetCategories(articles, ProviderAliases).OrderBy(x => x.ProviderName).ToList();
                model.Authors = GetCategories(articles, AuthorAliases).OrderBy(x => x.ProviderName).ToList();
            }

            model.AvailableLanguages = (await languageService.GetAllAsync()).ToList();

            // need to predefine them to not crash the report
            model.SelectedProvider = new DropdownItem();
            model.SelectedAuthor = new DropdownItem();
            model.SelectedLanguage = string.Empty;

            return View(model);
        }

        [HttpGet]
        public async Task<ActionResult> SearchAfterHits(DateTime? fromDate, DateTime? toDate, string selectedProvider, string selectedAuthor, string selectedLanguage)
        {
            var syncIoFeature = HttpContext.Features.Get<IHttpBodyControlFeature>();
            if (syncIoFeature != null)
            {
                syncIoFeature.AllowSynchronousIO = true;
            }

            var filename = selectedProvider + "-" + selectedAuthor + "-" + selectedLanguage;
            var model = new ArticleGenerateReportViewModel(fromDate, toDate);
            var culture = string.IsNullOrWhiteSpace(selectedLanguage) ? null : selectedLanguage;
            var lang = string.IsNullOrWhiteSpace(culture) ? CultureInfo.CurrentUICulture : CultureInfo.GetCultureInfo(culture);
            var start = GetStartPage(culture);

            model.SelectedLanguage = culture ?? string.Empty;
            model.SearchRoot = start;
            model.AvailableLanguages = (await languageService.GetAllAsync()).ToList();

            var pages = start is null ? [] : GetDescendents(start, culture).ToList();
            model.Providers = GetCategories(pages.Where(IsArticlePage), ProviderAliases);
            model.Authors = GetCategories(pages.Where(IsArticlePage), AuthorAliases);

            if (selectedProvider == AllOption)
            {
                model.SelectedProvider = null;
                selectedProvider = string.Empty;
            }

            if (selectedAuthor == AllOption)
            {
                model.SelectedAuthor = null;
                selectedAuthor = string.Empty;
            }

            if (model.SearchRoot != null)
            {
                var list = new List<IPublishedContent>();
                foreach (var page in pages.Where(IsArticlePage))
                {
                    if (model.FromDate != null && GetChangedDate(page, culture) < model.FromDate)
                    {
                        continue;
                    }

                    if (model.ToDate != null && GetChangedDate(page, culture) > model.ToDate)
                    {
                        continue;
                    }

                    // Begge matcher
                    if (!string.IsNullOrEmpty(selectedProvider) && !string.IsNullOrEmpty(selectedAuthor) && CategoryListContains(page, selectedAuthor) && CategoryListContains(page, selectedProvider))
                    {
                        list.Add(page);
                        continue;
                    }

                    // Kun Provider
                    if (!string.IsNullOrEmpty(selectedProvider) && string.IsNullOrEmpty(selectedAuthor) && CategoryListContains(page, selectedProvider))
                    {
                        list.Add(page);
                        continue;
                    }

                    // Kun Author
                    if (string.IsNullOrEmpty(selectedProvider) && !string.IsNullOrEmpty(selectedAuthor) && CategoryListContains(page, selectedAuthor))
                    {
                        list.Add(page);
                        continue;
                    }

                    // Begge er null
                    if (string.IsNullOrEmpty(selectedProvider) && string.IsNullOrEmpty(selectedAuthor))
                    {
                        list.Add(page);
                        continue;
                    }
                }

                model.ArticleHits = list;

                var w = new StringBuilder();

                using (var ms = new MemoryStream())
                {
                    w.Append("<html><head><title></title>" +
                        //"<link rel=\"stylesheet\" href=\"/Static/css/style.min.css\">" +
                        //"<link rel=\"stylesheet\" href=\"/Static/css/articleExport.css\">" +
                        "<style>" +
                        "body {background - color: none!important; color: none!important;}" +
                        "a{color: blue!important;}" +
                        "</style>" +
                        "</head><body>");

                    w.Append("<table style='border:1px solid #000000;border-collapse: collapse'>");
                    w.Append("<tr><th style='border:1px solid #000000;'>Eier(e)</th><th style='border:1px solid #000000;'>Innhold</th></tr>");

                    foreach (var articlePageBase in list)
                    {
                        if (IsSchemaPage(articlePageBase))
                        {
                            var schemaCategories = GetCommaSeparatedCategories(articlePageBase);

                            w.Append("<tr>");
                            w.Append("<td style='border:1px solid #000000; vertical-align: top;'>" + (string.IsNullOrEmpty(schemaCategories) ? "Coordinator" : schemaCategories) + "</td>");

                            w.Append("<td style='border:1px solid #000000; padding-left:25px;'><h2><a href='" + articlePageBase.Url(culture, UrlMode.Absolute) + "'>" + articlePageBase.Name + "</a></h2>");
                            w.Append("<p><b>" + GetRichTextOrString(articlePageBase, MainIntroAlias, culture) + "</b></p>");

                            var accordianList = GetBlockList(articlePageBase, culture, AccordianListAlias, AccordionListAlias);
                            if (accordianList != null)
                            {
                                w.Append("<h2>" + GetLocalizedSchemaHeading(lang) + "</h2>");

                                foreach (var contentAreaItem in accordianList)
                                {
                                    var content = contentAreaItem.Content;
                                    var translatedHeading = content.Value<string>(publishedValueFallback, TranslatedHeadingAlias, culture);
                                    if (string.IsNullOrEmpty(translatedHeading))
                                    {
                                        w.Append("<h3>" + content.Value<string>(publishedValueFallback, HeadingAlias, culture) + "</h3>");
                                    }
                                    else
                                    {
                                        w.Append("<h3>" + GetLocalizedText(translatedHeading, lang) + "</h3>");
                                    }

                                    w.Append(GetElementRichTextOrString(content, DescriptionAlias, culture));
                                }
                            }

                            w.Append("</td></tr>");
                            continue;
                        }

                        var articleCategories = GetCommaSeparatedCategories(articlePageBase);
                        w.Append("<tr>");
                        w.Append("<td style='border:1px solid #000000; vertical-align: top;'>" + (string.IsNullOrEmpty(articleCategories) ? "Coordinator" : articleCategories) + "</td>");

                        w.Append("<td style='border:1px solid #000000; padding-left:25px;'><h2><a href='" + articlePageBase.Url(culture, UrlMode.Absolute) + "'>" + articlePageBase.Name + "</a></h2>");
                        w.Append("<p><b>" + articlePageBase.Value<string>(publishedValueFallback, MainIntroAlias, culture) + "</b></p>");

                        var mainBody = GetRichTextOrString(articlePageBase, MainBodyAlias, culture);
                        if (!string.IsNullOrWhiteSpace(mainBody))
                        {
                            w.Append("<p>" + mainBody + "</p>");
                        }

                        w.Append("</td></tr>");
                    }

                    w.Append("</table></body></html>");

                    using (WordprocessingDocument package = WordprocessingDocument.Create(ms, WordprocessingDocumentType.Document))
                    {
                        MainDocumentPart mainPart = package.MainDocumentPart ?? package.AddMainDocumentPart();
                        mainPart.Document = new Document(new Body());
                        var html = w.ToString();

                        html = CorrectUrls(html);

                        var htmlCssInline = PreMailer.Net.PreMailer.MoveCssInline(html);

                        var finalHtml = htmlCssInline.Html;

                        var document = new HtmlDocument();
                        document.LoadHtml(finalHtml);
                        RemoveEmptyNodes(document.DocumentNode);
                        AddInvisibleCharacter(document.DocumentNode);
                        finalHtml = document.DocumentNode.OuterHtml;

                        var altChunkId = "ArticleReportHtml";
                        AlternativeFormatImportPart chunk = mainPart.AddAlternativeFormatImportPart(AlternativeFormatImportPartType.Html, altChunkId);
                        using (var writer = new StreamWriter(chunk.GetStream(FileMode.Create, FileAccess.Write), Encoding.UTF8))
                        {
                            writer.Write(finalHtml);
                        }

                        mainPart.Document.Body!.AppendChild(new AltChunk { Id = altChunkId });
                        mainPart.Document.Save();
                    }

                    var bytes = ms.ToArray();

                    var ifErrors = "";
                    if (errors > 0)
                    {
                        ifErrors = " " + errors + " errors";
                    }

                    Response.Clear();
                    Response.Headers.Append("content-disposition", "attachment;    filename=Articles " + WebUtility.UrlEncode(filename) + ifErrors + ".docx");

                    return File(bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
                }
            }

            return View(model);
        }

        public bool CategoryListContains(IPublishedContent page, string name)
        {
            return GetCategoryNames(page).Any(categoryName => categoryName.Equals(name, StringComparison.OrdinalIgnoreCase));
        }

        public string GetCommaSeparatedCategories(IPublishedContent page)
        {
            var categoryNames = GetCategoryNames(page).ToList();
            return string.Join(", ", categoryNames);
        }

        private IPublishedContent? GetStartPage(string? culture)
        {
            var roots = umbracoHelper.ContentAtRoot();
            return roots
                .Where(x => string.IsNullOrWhiteSpace(culture) || x.Cultures.ContainsKey(culture))
                .FirstOrDefault(x => x.ContentType.Alias.Equals(StartPageAlias, StringComparison.OrdinalIgnoreCase))
                ?? roots.FirstOrDefault(x => string.IsNullOrWhiteSpace(culture) || x.Cultures.ContainsKey(culture));
        }

        private static IEnumerable<IPublishedContent> GetDescendents(IPublishedContent root, string? culture)
        {
            foreach (var child in root.Children(culture))
            {
                yield return child;

                foreach (var descendent in GetDescendents(child, culture))
                {
                    yield return descendent;
                }
            }
        }

        private static bool IsArticlePage(IPublishedContent page)
        {
            return ArticlePageAliases.Contains(page.ContentType.Alias, StringComparer.OrdinalIgnoreCase);
        }

        private static bool IsSchemaPage(IPublishedContent page)
        {
            return page.ContentType.Alias.Equals(SchemaPageAlias, StringComparison.OrdinalIgnoreCase);
        }

        private static DateTime GetChangedDate(IPublishedContent page, string? culture)
        {
            return culture != null && page.Cultures.TryGetValue(culture, out var cultureInfo)
                ? cultureInfo.Date
                : page.UpdateDate;
        }

        private List<DropdownItem> GetCategories(IEnumerable<IPublishedContent> pages, IEnumerable<string> aliases)
        {
            return pages
                .SelectMany(page => GetPropertyValues(page, aliases))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .OrderBy(x => x)
                .Select(x => new DropdownItem(x))
                .ToList();
        }

        private IEnumerable<string> GetCategoryNames(IPublishedContent page)
        {
            foreach (var provider in GetPropertyValues(page, ProviderAliases))
            {
                yield return provider;
            }

            foreach (var author in GetPropertyValues(page, AuthorAliases))
            {
                yield return author;
            }
        }

        private IEnumerable<string> GetPropertyValues(IPublishedContent page, IEnumerable<string> aliases)
        {
            foreach (var alias in aliases)
            {
                if (!page.HasProperty(alias))
                {
                    continue;
                }

                foreach (var value in ExtractValues(page.Value(publishedValueFallback, alias)))
                {
                    yield return value;
                }
            }
        }

        private static IEnumerable<string> ExtractValues(object? value)
        {
            switch (value)
            {
                case null:
                    yield break;
                case string text:
                    foreach (var item in text.Split([',', ';'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
                    {
                        yield return item;
                    }
                    break;
                case IPublishedContent content:
                    yield return content.Name;
                    break;
                case IEnumerable<IPublishedContent> contents:
                    foreach (var content in contents)
                    {
                        yield return content.Name;
                    }
                    break;
                case IEnumerable<string> strings:
                    foreach (var item in strings.Where(x => !string.IsNullOrWhiteSpace(x)))
                    {
                        yield return item.Trim();
                    }
                    break;
                default:
                    var textValue = value.ToString();
                    if (!string.IsNullOrWhiteSpace(textValue))
                    {
                        yield return textValue.Trim();
                    }
                    break;
            }
        }

        private string GetRichTextOrString(IPublishedContent content, string alias, string? culture)
        {
            return content.Value<string>(publishedValueFallback, alias, culture) ?? string.Empty;
        }

        private string GetElementRichTextOrString(IPublishedElement content, string alias, string? culture)
        {
            return content.Value<string>(publishedValueFallback, alias, culture) ?? string.Empty;
        }

        private BlockListModel? GetBlockList(IPublishedContent page, string? culture, params string[] aliases)
        {
            foreach (var alias in aliases)
            {
                if (!page.HasProperty(alias))
                {
                    continue;
                }

                var value = page.Value<BlockListModel>(publishedValueFallback, alias, culture);
                if (value != null)
                {
                    return value;
                }
            }

            return null;
        }

        private string GetLocalizedSchemaHeading(CultureInfo lang)
        {
            return GetLocalizedText("/schema/aboutthisschema", lang);
        }

        private string GetLocalizedText(string key, CultureInfo lang)
        {
            var normalizedKey = key.Trim('/');
            var parts = normalizedKey.Split('/', 2, StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length == 2)
            {
                return localizedTextService.Localize(parts[0], parts[1], lang, null);
            }

            return localizedTextService.Localize("general", normalizedKey, lang, null);
        }

        private string CorrectUrls(string html)
        {
            var writer = new StringWriter();

            var referer = Request.GetTypedHeaders().Referer;
            if (referer == null) return html;

            var baseUrl = referer.GetLeftPart(UriPartial.Authority);

            var doc = new HtmlDocument();
            doc.LoadHtml(html);

            foreach (var link in doc.DocumentNode.Descendants("link"))
            {
                if (link.Attributes["href"] != null)
                {
                    link.Attributes["href"].Value = new Uri(new Uri(baseUrl), link.Attributes["href"].Value).AbsoluteUri;
                }
            }

            foreach (var img in doc.DocumentNode.Descendants("img"))
            {
                if (img.Attributes["src"] != null)
                {
                    img.Attributes["src"].Value = new Uri(new Uri(baseUrl), img.Attributes["src"].Value).AbsoluteUri;
                }
            }

            foreach (var a in doc.DocumentNode.Descendants("a"))
            {
                if (a != null && a.Attributes["data-toggle"] == null)
                {
                    if (a.Attributes["href"] == null || a.Attributes["href"].Value == "")
                    {
                        HtmlAttribute attr = doc.CreateAttribute("href", "#");

                        a.Attributes.Add(attr);
                    }
                    else
                    {
                        try
                        {
                            a.Attributes["href"].Value = new Uri(new Uri(baseUrl), a.Attributes["href"].Value).AbsoluteUri;
                        }
                        catch
                        {
                            errors++;
                            var inlineStyle = "border:5px solid red; background-color: #f8d7da;";
                            a.Attributes["href"].Value = "https://altinn.no";
                            if (a.ParentNode.Attributes["style"] == null)
                            {
                                a.ParentNode.Attributes.Add("style", inlineStyle);
                            }
                            else
                            {
                                a.ParentNode.Attributes["style"].Value += inlineStyle;
                            }
                        }
                    }
                }
            }

            doc.Save(writer);

            return writer.ToString();
        }

        /// <summary>
        /// HtmlToOpenXml 2.3.0 crashed when converting pages containing empty headings. Keep the cleanup for Word import.
        /// </summary>
        /// <param name="containerNode">Root node of the final document</param>
        private static void RemoveEmptyNodes(HtmlNode containerNode)
        {
            var nodesToRemove = new List<string> { "a", "h1", "h2", "h3", "h4", "h5", "h6", "p" };

            if (nodesToRemove.Contains(containerNode.Name) && string.IsNullOrEmpty(containerNode.InnerText))
            {
                containerNode.Remove();
            }
            else
            {
                for (var i = containerNode.ChildNodes.Count - 1; i >= 0; i--)
                {
                    RemoveEmptyNodes(containerNode.ChildNodes[i]);
                }
            }
        }

        /// <summary>
        /// Keep the heading workaround from the Optimizely version for Word import.
        /// </summary>
        /// <param name="containerNode">Root node of the final document</param>
        private static void AddInvisibleCharacter(HtmlNode containerNode)
        {
            var headingTags = new List<string> { "h1", "h2", "h3", "h4", "h5", "h6" };

            if (headingTags.Contains(containerNode.Name) && !string.IsNullOrEmpty(containerNode.InnerText) && char.IsDigit(containerNode.InnerText[0]))
            {
                containerNode.ParentNode.ReplaceChild(HtmlNode.CreateNode("<h2>\u00A0" + containerNode.InnerText + "</h2>"), containerNode);
            }
            else
            {
                for (var i = containerNode.ChildNodes.Count - 1; i >= 0; i--)
                {
                    AddInvisibleCharacter(containerNode.ChildNodes[i]);
                }
            }
        }
    }

    public class ArticleGenerateReportViewModel
    {
        public ArticleGenerateReportViewModel()
        {
        }

        public ArticleGenerateReportViewModel(DateTime? fromDate, DateTime? toDate)
        {
            FromDate = fromDate;
            ToDate = toDate;
        }

        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public IPublishedContent? SearchRoot { get; set; }
        public List<DropdownItem> Providers { get; set; } = [];
        public List<DropdownItem> Authors { get; set; } = [];
        public List<ILanguage> AvailableLanguages { get; set; } = [];
        public DropdownItem? SelectedProvider { get; set; }
        public DropdownItem? SelectedAuthor { get; set; }
        public string SelectedLanguage { get; set; } = string.Empty;
        public List<IPublishedContent> ArticleHits { get; set; } = [];
    }

    public class DropdownItem
    {
        public DropdownItem() { }
        public DropdownItem(Category cat)
        {
            //Id = cat.ID;
            //ProviderName = cat.Name;
        }
        public int Id { get; set; }
        public string ProviderName { get; set; }
    }
}
