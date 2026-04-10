/**
 * Shared types and interfaces for header configuration
 */


/**
 * Menu pages extracted from HeaderViewModel
 */
export interface MenuPages {
  startAndRunCompany?: any;
  helpPage?: any;
  accessManagementPage?: any;
  loginPage?: any;
  inboxPage?: any;
  schemaOverviewPage?: any;
  profilePage?: any;
  aboutNewAltinnPage?: any;
  searchPageUrl?: string;
  searchTextPlaceholder?: string;
  chooseLanguageText?: string;
  menuLanguageList?: { languageName: string; pageUrl: string; selected: boolean }[];
}

/**
 * Text labels for account descriptions
 */
export interface AccountTexts {
  dateOfBirthText: string;
  orgNrText: string;
  youText: string;
}

/**
 * Text labels for menu items
 */
export interface MenuTexts {
  shortcutText: string;
  menuText: string;
}

/**
 * Text labels for group titles
 */
export interface GroupTexts {
  meAndFavoritesText: string;
  allOrganizationsText: string;
}
