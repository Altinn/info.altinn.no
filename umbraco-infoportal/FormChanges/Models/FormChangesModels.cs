namespace Infoportal.Cms.FormChanges.Models;

public sealed class FormChangesFilters
{
    public DateOnly? FromDate { get; init; }
    public DateOnly? ToDate { get; init; }
}

public sealed record FormChangesReport(
    DateOnly FromDate,
    DateOnly ToDate,
    IReadOnlyList<FormChangeRow> NewPages,
    IReadOnlyList<FormChangeRow> ChangedPages,
    IReadOnlyList<FormChangeRow> UnpublishedPages,
    IReadOnlyList<FormChangeRow> TrashedPages);

// Date is UTC; the dashboard formats it in the editor's local time zone.
public sealed record FormChangeRow(
    Guid Key,
    string ServiceOwner,
    string Title,
    string Language,
    DateTime Date);
