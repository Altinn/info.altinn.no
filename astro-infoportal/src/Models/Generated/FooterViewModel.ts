/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

import { IReactProps } from "./IReactProps";
import { IReactComponentProps } from "./IReactComponentProps";
import { BaseReactComponentProps } from "./BaseReactComponentProps";
import { LinkItemViewModel } from "./LinkItemViewModel";

export interface FooterViewModel extends IReactProps, IReactComponentProps, BaseReactComponentProps {
  startAndRunCompany?: LinkItemViewModel;
  helpPage?: LinkItemViewModel;
  address1?: string;
  address2?: string;
  aboutAltinnReference?: LinkItemViewModel;
  operationalMessagesReference?: LinkItemViewModel;
  privacyReference?: LinkItemViewModel;
  accessibilityLocation?: LinkItemViewModel;
  searchContext?: string;
  searchPageUrl?: string;
  searchUrlBody?: string;
}
