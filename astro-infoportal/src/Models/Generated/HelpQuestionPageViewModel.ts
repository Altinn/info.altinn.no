/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

import { IReactProps } from "./IReactProps";
import { IReactComponentProps } from "./IReactComponentProps";
import { BaseReactComponentProps } from "./BaseReactComponentProps";
import { RichTextAreaProps } from "./RichTextAreaProps";
import { BreadcrumbViewModel } from "./BreadcrumbViewModel";

export interface HelpQuestionPageViewModel extends IReactProps, IReactComponentProps, BaseReactComponentProps {
  pageName?: string;
  hideFromQuickHelp: boolean;
  mainBody?: RichTextAreaProps;
  breadcrumb: BreadcrumbViewModel;
}
