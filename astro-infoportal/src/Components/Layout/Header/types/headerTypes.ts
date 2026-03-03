/**
 * Shared types and interfaces for header configuration
 */

import type { LinkItemViewModel } from "/Models/Generated/LinkItemViewModel";

/**
 * Menu pages extracted from HeaderViewModel
 */
export interface MenuPages {
  startAndRunCompany?: LinkItemViewModel;
  helpPage?: LinkItemViewModel;
  accessManagementPage?: LinkItemViewModel;
  loginPage?: LinkItemViewModel;
  inboxPage?: LinkItemViewModel;
  schemaOverviewPage?: LinkItemViewModel;
  profilePage?: LinkItemViewModel;
  aboutNewAltinnPage?: LinkItemViewModel;
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
