export const SearchContext = {
  All: "All",
  StartCompany: "StartCompany",
  Schema: "Schema",
  Help: "Help",
} as const;

export type SearchContextType = (typeof SearchContext)[keyof typeof SearchContext];

// Icon mapping per context — resolved from @navikt/aksel-icons by name
export const SearchContextIcons: Record<string, string | undefined> = {
  [SearchContext.StartCompany]: "Buildings3Icon",
  [SearchContext.Help]: "InformationSquareIcon",
};

// Display names per language
export const SearchContextLabels: Record<string, Record<string, string>> = {
  nb: {
    [SearchContext.All]: "Alt innhold",
    [SearchContext.StartCompany]: "Starte og drive bedrift",
    [SearchContext.Schema]: "Skjema",
    [SearchContext.Help]: "Hjelp",
  },
  nn: {
    [SearchContext.All]: "Alt innhald",
    [SearchContext.StartCompany]: "Starte og drive bedrift",
    [SearchContext.Schema]: "Skjema",
    [SearchContext.Help]: "Hjelp",
  },
  en: {
    [SearchContext.All]: "All content",
    [SearchContext.StartCompany]: "Start and run company",
    [SearchContext.Schema]: "Forms",
    [SearchContext.Help]: "Help",
  },
};
