import { t, type Locale } from "@i18n/index";

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
export function getSearchContextLabels(locale: Locale): Record<string, string> {
  return {
    [SearchContext.All]: t("searchContext.all", locale),
    [SearchContext.StartCompany]: t("searchContext.startCompany", locale),
    [SearchContext.Schema]: t("searchContext.schema", locale),
    [SearchContext.Help]: t("searchContext.help", locale),
  };
}

// Static lookup for React components that need labels by locale string
export const SearchContextLabels: Record<string, Record<string, string>> = {
  nb: getSearchContextLabels("nb"),
  nn: getSearchContextLabels("nn"),
  en: getSearchContextLabels("en"),
};
