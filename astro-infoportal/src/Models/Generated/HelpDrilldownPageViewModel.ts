/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

import { IReactProps } from "./IReactProps";
import { IReactComponentProps } from "./IReactComponentProps";
import { BaseReactComponentProps } from "./BaseReactComponentProps";
import { HelpLandingPageItemViewModel } from "./HelpLandingPageItemViewModel";
import { ContentAreaProps } from "./ContentAreaProps";
import { BreadcrumbViewModel } from "./BreadcrumbViewModel";

export interface HelpDrilldownPageViewModel extends IReactProps, IReactComponentProps, BaseReactComponentProps {
  pageName?: string;
  triggerWords?: string;
  iconUrl?: string;
  altImage?: string;
  landingPages: HelpLandingPageItemViewModel[];
  bottomContentArea?: ContentAreaProps;
  breadcrumb: BreadcrumbViewModel;
}
