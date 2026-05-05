namespace Infoportal.Adapters.Elasticsearch;

public enum SearchContext
{
    All,
    StartCompany,
    Schema,
    Help
}

public static class SearchContextMapping
{
    // Maps content type aliases to search contexts.
    // Entries for content types that do not yet exist in Umbraco are harmless:
    // they simply never match until the content type is created and content is published.
    // Keep this list in sync with SearchContextMapping.ts on the frontend.
    private static readonly Dictionary<string, SearchContext> ContentTypeToContext = new(StringComparer.OrdinalIgnoreCase)
    {
        { "sectionArticlePage", SearchContext.StartCompany },
        { "subsidyPage", SearchContext.StartCompany },
        { "schemaPage", SearchContext.Schema },
        { "schemaCollectionPage", SearchContext.Schema },
        { "schemaAttachmentPage", SearchContext.Schema },
        { "helpQuestionPage", SearchContext.Help },
        { "helpProcessArticlePage", SearchContext.Help },
    };

    // Reverse lookup: context → list of content type aliases
    private static readonly Dictionary<string, string[]> ContextToContentTypes =
        ContentTypeToContext
            .GroupBy(kv => kv.Value)
            .ToDictionary(
                g => g.Key.ToString(),
                g => g.Select(kv => kv.Key).ToArray(),
                StringComparer.OrdinalIgnoreCase);

    /// <summary>
    /// Returns the content type aliases that belong to the given search context.
    /// Returns null for "All" or unknown contexts (no filtering needed).
    /// </summary>
    public static string[]? GetContentTypesForContext(string? context)
    {
        if (string.IsNullOrEmpty(context) || context.Equals(nameof(SearchContext.All), StringComparison.OrdinalIgnoreCase))
            return null;

        return ContextToContentTypes.TryGetValue(context, out var types) ? types : null;
    }

    /// <summary>
    /// Returns the search context for a given content type alias.
    /// Returns null if the content type is not mapped to any context.
    /// </summary>
    public static string? GetContextForContentType(string contentTypeAlias)
    {
        return ContentTypeToContext.TryGetValue(contentTypeAlias, out var context)
            ? context.ToString()
            : null;
    }

    /// <summary>
    /// Groups raw content type counts into search context counts.
    /// Filters out contexts with zero results.
    /// </summary>
    public static Dictionary<string, long> GroupByContext(IEnumerable<KeyValuePair<string, long>> contentTypeCounts)
    {
        var contextCounts = new Dictionary<string, long>(StringComparer.OrdinalIgnoreCase);

        foreach (var (contentType, count) in contentTypeCounts)
        {
            var context = GetContextForContentType(contentType);
            if (context == null) continue;

            if (contextCounts.ContainsKey(context))
                contextCounts[context] += count;
            else
                contextCounts[context] = count;
        }

        return contextCounts;
    }
}
