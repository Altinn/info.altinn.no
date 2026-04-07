/**
 * Event handlers for header interactions
 */

import { isBrowser } from "../utils/browserUtils";

/**
 * Creates a locale select handler
 * @param menuLanguageList List of available languages
 * @returns Handler function for locale selection
 */
export const createLocaleSelectHandler = (
  menuLanguageList: any[],
) => {
  return (value: string) => {
    if (!isBrowser) return;
    const selected = menuLanguageList.find((l: any) => l.languageName === value);
    if (selected) location.assign(selected.pageUrl);
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
