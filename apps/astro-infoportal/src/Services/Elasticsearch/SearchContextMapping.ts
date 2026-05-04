const SearchContext = {
  All: "All",
  StartCompany: "StartCompany",
  Schema: "Schema",
  Help: "Help",
} as const;

// Entries for content types that do not yet exist in Umbraco are harmless:
// they simply never match until the content type is created and content is published.
// Keep this list in sync with SearchContextMapping.cs on the backend.
const contentTypeToContext: Record<string, string> = {
  sectionArticlePage: SearchContext.StartCompany,
  subsidyPage: SearchContext.StartCompany,
  schemaPage: SearchContext.Schema,
  schemaCollectionPage: SearchContext.Schema,
  schemaAttachmentPage: SearchContext.Schema,
  helpQuestionPage: SearchContext.Help,
  helpProcessArticlePage: SearchContext.Help,
};

const contextToContentTypes: Record<string, string[]> = {};
for (const [contentType, context] of Object.entries(contentTypeToContext)) {
  if (!contextToContentTypes[context]) {
    contextToContentTypes[context] = [];
  }
  contextToContentTypes[context].push(contentType);
}

/**
 * Returns the content type aliases that belong to the given search context.
 * Returns null for "All" or unknown contexts (no filtering needed).
 */
export function getContentTypesForContext(
  context: string | null | undefined,
): string[] | null {
  if (!context || context.toLowerCase() === "all") {
    return null;
  }
  for (const [key, types] of Object.entries(contextToContentTypes)) {
    if (key.toLowerCase() === context.toLowerCase()) {
      return types;
    }
  }
  return null;
}

/**
 * Returns the search context name for a given content type alias.
 * Returns null if the content type is not mapped.
 */
export function getContextForContentType(
  contentTypeAlias: string,
): string | null {
  return contentTypeToContext[contentTypeAlias] ?? null;
}

/**
 * Groups raw content type counts from ES aggregation buckets into search context counts.
 */
export function groupByContext(
  contentTypeCounts: Array<{ key: string; count: number }>,
): Record<string, number> {
  const contextCounts: Record<string, number> = {};

  for (const { key, count } of contentTypeCounts) {
    const context = getContextForContentType(key);
    if (!context) continue;

    contextCounts[context] = (contextCounts[context] ?? 0) + count;
  }

  return contextCounts;
}
