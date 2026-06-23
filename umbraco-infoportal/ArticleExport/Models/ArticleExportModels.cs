namespace umbraco_infoportal.ArticleExport.Models;

public sealed record FilterOptionsResponse(
    IReadOnlyList<string> Providers,
    IReadOnlyList<string> Authors,
    IReadOnlyList<LanguageOption> Languages);

public sealed record LanguageOption(string IsoCode, string Name);

public sealed class ExportFilters
{
    public DateTime? FromDate { get; init; }
    public DateTime? ToDate { get; init; }
    public string? Provider { get; init; }
    public string? Author { get; init; }
    public string? Language { get; init; }
}

public sealed record ArticleReport(byte[] Content, string FileName, int PageCount);
