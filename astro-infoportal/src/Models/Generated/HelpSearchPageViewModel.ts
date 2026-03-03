/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

import { IReactProps } from "./IReactProps";
import { IReactComponentProps } from "./IReactComponentProps";
import { BaseReactComponentProps } from "./BaseReactComponentProps";
import { HelpChildPageItemViewModel } from "./HelpChildPageItemViewModel";
import { BreadcrumbViewModel } from "./BreadcrumbViewModel";

export interface HelpSearchPageViewModel extends IReactProps, IReactComponentProps, BaseReactComponentProps {
  pageName?: string;
  query?: string;
  totalHits: number;
  results: HelpChildPageItemViewModel[];
  searchHitsText?: string;
  searchForText?: string;
  advertisementIntroText?: string;
  clickHereText?: string;
  toSearchForText?: string;
  inText?: string;
  otherContentText?: string;
  searchPageUrl?: string;
  helpSearchPageUrl?: string;
  searchPlaceholder?: string;
  breadcrumb: BreadcrumbViewModel;
}
