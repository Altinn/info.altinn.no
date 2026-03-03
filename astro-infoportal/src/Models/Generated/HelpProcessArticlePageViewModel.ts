/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

import { IReactProps } from "./IReactProps";
import { IReactComponentProps } from "./IReactComponentProps";
import { BaseReactComponentProps } from "./BaseReactComponentProps";
import { RichTextAreaProps } from "./RichTextAreaProps";
import { TimelineItemBlockViewModel } from "./TimelineItemBlockViewModel";
import { ContentAreaProps } from "./ContentAreaProps";
import { BreadcrumbViewModel } from "./BreadcrumbViewModel";

export interface HelpProcessArticlePageViewModel extends IReactProps, IReactComponentProps, BaseReactComponentProps {
  pageName?: string;
  hideFromQuickHelp: boolean;
  mainIntro?: string;
  mainBody?: RichTextAreaProps;
  timeline: TimelineItemBlockViewModel[];
  bottomContentArea?: ContentAreaProps;
  linkToPortalProcess?: string;
  lastUpdatedDateText?: string;
  lastUpdatedDateString?: string;
  breadcrumb: BreadcrumbViewModel;
}
