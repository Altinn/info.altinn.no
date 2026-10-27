using umbraco_infoportal.FormChanges.Models;
using Umbraco.Cms.Infrastructure.Scoping;

namespace umbraco_infoportal.FormChanges.Services;

// Lists what has happened to the form catalog (skjemakatalogen) in a date range, so the
// editorial secretariat can quality-assure pages that service owners publish themselves.
// Reads the audit log (umbracoLog) rather than content versions: version cleanup prunes
// old versions, while the publish/unpublish/trash entries in the log are kept.
public sealed class FormChangesReportService(IScopeProvider scopeProvider)
{
    public const int DefaultRangeDays = 14;

    // schemaAttachmentPage has the same editorial role as schemaPage (a service the
    // provider offers) and is listed next to it on the provider page.
    private static readonly string[] FormPageAliases = ["schemaPage", "schemaAttachmentPage"];

    private static readonly TimeZoneInfo NorwegianTime = TimeZoneInfo.FindSystemTimeZoneById("Europe/Oslo");

    // Service owner = the providerPage the form lives under. A trashed page sits under the
    // recycle bin, so its original parent is read from the relation Umbraco creates on trash.
    private const string FromFormPageEvent = @"
        FROM umbracoLog l
        JOIN umbracoNode n ON n.id = l.NodeId
        JOIN umbracoContent c ON c.nodeId = n.id
        JOIN cmsContentType ct ON ct.nodeId = c.contentTypeId
        LEFT JOIN umbracoRelationType rt ON rt.alias = 'relateParentDocumentOnDelete'
        LEFT JOIN umbracoRelation r ON r.relType = rt.id AND r.childId = n.id AND n.trashed = 1
        LEFT JOIN umbracoNode o ON o.id = CASE WHEN n.trashed = 1 THEN r.parentId ELSE n.parentId END
        WHERE ct.alias IN (@0)";

    private const string SelectEventColumns = @"
        SELECT n.id AS NodeId, n.uniqueId AS NodeKey, n.text AS NodeName, o.text AS ServiceOwner,
               l.Datestamp AS EventDate, l.parameters AS Cultures";

    public static (DateOnly From, DateOnly To) ResolveRange(FormChangesFilters filters)
    {
        DateOnly today = DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, NorwegianTime));
        DateOnly to = filters.ToDate ?? today;
        DateOnly from = filters.FromDate ?? to.AddDays(-DefaultRangeDays);
        return (from, to);
    }

    public FormChangesReport BuildReport(DateOnly fromDate, DateOnly toDate)
    {
        // The dashboard's dates are Norwegian calendar days; the log stores UTC.
        DateTime from = ToUtc(fromDate);
        DateTime to = ToUtc(toDate.AddDays(1));

        using IScope scope = scopeProvider.CreateScope(autoComplete: true);

        Dictionary<string, string> languageNames = scope.Database
            .Fetch<LanguageRow>("SELECT languageISOCode AS IsoCode, languageCultureName AS Name FROM umbracoLanguage")
            .ToDictionary(x => x.IsoCode, x => x.Name, StringComparer.OrdinalIgnoreCase);

        Dictionary<(int NodeId, string Culture), string> cultureNames = scope.Database
            .Fetch<CultureNameRow>(@"
                SELECT dcv.nodeId AS NodeId, lang.languageISOCode AS Culture, dcv.name AS Name
                FROM umbracoDocumentCultureVariation dcv
                JOIN umbracoLanguage lang ON lang.id = dcv.languageId
                JOIN umbracoContent c ON c.nodeId = dcv.nodeId
                JOIN cmsContentType ct ON ct.nodeId = c.contentTypeId
                WHERE ct.alias IN (@0)", FormPageAliases)
            .Where(x => !string.IsNullOrWhiteSpace(x.Name))
            .ToDictionary(x => (x.NodeId, x.Culture.ToLowerInvariant()), x => x.Name!);

        // Every publish of a form page that was published in the range, back to its first
        // publish: whether that first publish falls in the range decides new vs. changed.
        List<FormEventRow> publishes = scope.Database.Fetch<FormEventRow>(
            SelectEventColumns + FromFormPageEvent + @"
                AND l.logHeader = 'PublishVariant'
                AND l.Datestamp < @2
                AND EXISTS (SELECT 1 FROM umbracoLog x
                            WHERE x.NodeId = l.NodeId AND x.logHeader = 'PublishVariant'
                            AND x.Datestamp >= @1 AND x.Datestamp < @2)",
            FormPageAliases, from, to);

        List<FormEventRow> unpublishes = scope.Database.Fetch<FormEventRow>(
            SelectEventColumns + FromFormPageEvent + @"
                AND l.logHeader = 'UnpublishVariant'
                AND l.Datestamp >= @1 AND l.Datestamp < @2",
            FormPageAliases, from, to);

        // Only pages still in the recycle bin: restored pages are no longer discarded, and
        // permanently deleted pages have no node left to report on.
        List<FormEventRow> trashes = scope.Database.Fetch<FormEventRow>(
            SelectEventColumns + FromFormPageEvent + @"
                AND l.logHeader = 'Move' AND l.logComment LIKE 'Moved to recycle bin%'
                AND n.trashed = 1
                AND l.Datestamp >= @1 AND l.Datestamp < @2",
            FormPageAliases, from, to);

        var newPages = new List<FormChangeRow>();
        var changedPages = new List<FormChangeRow>();

        foreach (IGrouping<(int NodeId, string Culture), (FormEventRow Row, string Culture)> group in
                 publishes.SelectMany(PerCulture).GroupBy(x => (x.Row.NodeId, x.Culture)))
        {
            List<FormEventRow> events = group.Select(x => x.Row).OrderBy(x => x.EventDate).ToList();
            FormEventRow first = events[0];
            FormEventRow latest = events[^1];

            // A page first published in the range is listed as new only — it needs a full
            // review anyway, so its later edits in the same range are not listed again.
            if (first.EventDate >= from)
            {
                newPages.Add(ToRow(first, group.Key.Culture, first.EventDate));
            }
            else
            {
                changedPages.Add(ToRow(latest, group.Key.Culture, latest.EventDate));
            }
        }

        List<FormChangeRow> unpublishedPages = unpublishes
            .SelectMany(PerCulture)
            .GroupBy(x => (x.Row.NodeId, x.Culture))
            .Select(g => g.MaxBy(x => x.Row.EventDate))
            .Select(x => ToRow(x.Row, x.Culture, x.Row.EventDate))
            .ToList();

        // Trashing removes the whole page, so the row lists every language it existed in.
        List<FormChangeRow> trashedPages = trashes
            .GroupBy(x => x.NodeId)
            .Select(g => g.MaxBy(x => x.EventDate)!)
            .Select(x => new FormChangeRow(
                x.NodeKey,
                x.ServiceOwner ?? string.Empty,
                x.NodeName ?? string.Empty,
                string.Join(", ", languageNames
                    .Where(lang => cultureNames.ContainsKey((x.NodeId, lang.Key.ToLowerInvariant())))
                    .Select(lang => lang.Value)),
                AsUtc(x.EventDate)))
            .ToList();

        return new FormChangesReport(
            fromDate,
            toDate,
            NewestFirst(newPages),
            NewestFirst(changedPages),
            NewestFirst(unpublishedPages),
            NewestFirst(trashedPages));

        FormChangeRow ToRow(FormEventRow row, string culture, DateTime date) => new(
            row.NodeKey,
            row.ServiceOwner ?? string.Empty,
            cultureNames.GetValueOrDefault((row.NodeId, culture)) ?? row.NodeName ?? string.Empty,
            languageNames.GetValueOrDefault(culture) ?? culture,
            AsUtc(date));
    }

    // The log stores the affected cultures as "nb, nn, en".
    private static IEnumerable<(FormEventRow Row, string Culture)> PerCulture(FormEventRow row) =>
        (row.Cultures ?? string.Empty)
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(culture => (row, culture.ToLowerInvariant()));

    private static List<FormChangeRow> NewestFirst(IEnumerable<FormChangeRow> rows) =>
        rows.OrderByDescending(x => x.Date).ThenBy(x => x.Title, StringComparer.OrdinalIgnoreCase).ToList();

    private static DateTime ToUtc(DateOnly date) =>
        TimeZoneInfo.ConvertTimeToUtc(date.ToDateTime(TimeOnly.MinValue, DateTimeKind.Unspecified), NorwegianTime);

    private static DateTime AsUtc(DateTime date) => DateTime.SpecifyKind(date, DateTimeKind.Utc);

    private sealed class LanguageRow
    {
        public string IsoCode { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
    }

    private sealed class CultureNameRow
    {
        public int NodeId { get; set; }
        public string Culture { get; set; } = string.Empty;
        public string? Name { get; set; }
    }

    private sealed class FormEventRow
    {
        public int NodeId { get; set; }
        public Guid NodeKey { get; set; }
        public string? NodeName { get; set; }
        public string? ServiceOwner { get; set; }
        public DateTime EventDate { get; set; }
        public string? Cultures { get; set; }
    }
}
