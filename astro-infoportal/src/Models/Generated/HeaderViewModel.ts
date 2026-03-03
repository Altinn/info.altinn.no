/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

import { IReactProps } from "./IReactProps";
import { IReactComponentProps } from "./IReactComponentProps";
import { BaseReactComponentProps } from "./BaseReactComponentProps";
import { BannerBlockViewModel } from "./BannerBlockViewModel";
import { LinkItemViewModel } from "./LinkItemViewModel";
import { LanguageItemViewModel } from "./LanguageItemViewModel";

export interface HeaderViewModel extends IReactProps, IReactComponentProps, BaseReactComponentProps {
  banner?: BannerBlockViewModel;
  startAndRunCompany?: LinkItemViewModel;
  helpPage?: LinkItemViewModel;
  loginPage?: LinkItemViewModel;
  schemaOverviewPage?: LinkItemViewModel;
  inboxPage?: LinkItemViewModel;
  accessManagementPage?: LinkItemViewModel;
  profilePage?: LinkItemViewModel;
  logOutPage?: LinkItemViewModel;
  aboutNewAltinnPage?: LinkItemViewModel;
  startPage?: LinkItemViewModel;
  loggedInAsText?: string;
  backButtonText?: string;
  chooseLanguageText?: string;
  menuLanguageList: LanguageItemViewModel[];
  shortcutText?: string;
  menuText?: string;
  searchTextPlaceholder?: string;
  searchPageUrl?: string;
  suggestionsTitle?: string;
  useSearchSuggestions: boolean;
  dateOfBirthText?: string;
  orgNrText?: string;
  hostBaseUrl?: string;
}
