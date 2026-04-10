/**
 * Event handlers for header interactions
 */

import { isBrowser } from "../utils/browserUtils";

/**
 * Creates a locale select handler
 * @param menuLanguageList List of available languages
 * @returns Handler function for locale selection
 */
// Search page slug mapping — search is the only static page with different slugs per language
const searchSlugMap: Record<string, string> = {
  nb: "/sok/",
  nn: "/nn/sok/",
  en: "/en/search/",
};

const searchSlugs = new Set(Object.values(searchSlugMap).flatMap(s => [s, s.replace(/\/$/, "")]));

function getLanguageCode(langName: string): string {
  const n = langName.toLowerCase();
  if (n.includes("nynorsk") || n === "nn") return "nn";
  if (n.includes("english") || n === "en") return "en";
  return "nb";
}

export const createLocaleSelectHandler = (
  menuLanguageList: any[],
) => {
  return (value: string) => {
    if (!isBrowser) return;
    const selected = menuLanguageList.find((l: any) => l.languageName === value);
    if (!selected) return;

    const currentPath = location.pathname;
    const langCode = getLanguageCode(selected.languageName);

    // If on a search page, navigate to the search page in the target language
    if (searchSlugs.has(currentPath)) {
      location.assign(searchSlugMap[langCode] + location.search);
      return;
    }

    // For Umbraco pages, use the pageUrl from the language list (provided by CMS)
    if (selected.pageUrl) {
      location.assign(selected.pageUrl);
    }
  };
};

/**
 * Transforms menu language list to language props format
 * @param menuLanguageList List of available languages
 * @returns Formatted language props
 */
export const buildLanguageProps = (menuLanguageList: any[]) => {
  if (!menuLanguageList || !Array.isArray(menuLanguageList)) {
    return [];
  }
  return menuLanguageList.map(({ languageName, selected }) => ({
    label: languageName,
    id: languageName,
    value: languageName,
    checked: selected,
  }));
};
