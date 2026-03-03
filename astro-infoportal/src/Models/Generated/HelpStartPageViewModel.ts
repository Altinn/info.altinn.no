/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

import { IReactProps } from "./IReactProps";
import { IReactComponentProps } from "./IReactComponentProps";
import { BaseReactComponentProps } from "./BaseReactComponentProps";
import { HelpDrilldownPageItemViewModel } from "./HelpDrilldownPageItemViewModel";
import { HelpChildPageItemViewModel } from "./HelpChildPageItemViewModel";
import { ContentAreaProps } from "./ContentAreaProps";
import { BreadcrumbViewModel } from "./BreadcrumbViewModel";

export interface HelpStartPageViewModel extends IReactProps, IReactComponentProps, BaseReactComponentProps {
  pageName?: string;
  mainIntro?: string;
  newDrilldownPages: HelpDrilldownPageItemViewModel[];
  oldDrilldownPages: HelpDrilldownPageItemViewModel[];
  newVersionHeading?: string;
  currentVersionHeading?: string;
  questionAreaHeading?: string;
  questionArea: HelpChildPageItemViewModel[];
  helpContentArea?: ContentAreaProps;
  breadcrumb?: BreadcrumbViewModel;
  helpSearchPageUrl?: string;
  searchPlaceholder?: string;
  searchAriaLabel?: string;
  helpContentAreaHeading?: string;
}
