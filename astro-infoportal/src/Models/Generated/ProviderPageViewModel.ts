/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

import { IReactProps } from "./IReactProps";
import { IReactComponentProps } from "./IReactComponentProps";
import { BaseReactComponentProps } from "./BaseReactComponentProps";
import { RichTextAreaProps } from "./RichTextAreaProps";
import { ProviderIconBlockViewModel } from "./ProviderIconBlockViewModel";
import { OperationalMessageViewModel } from "./OperationalMessageViewModel";
import { SchemaDataViewModel } from "./SchemaDataViewModel";
import { BreadcrumbViewModel } from "./BreadcrumbViewModel";

export interface ProviderPageViewModel extends IReactProps, IReactComponentProps, BaseReactComponentProps {
  pageName?: string;
  mainIntro?: RichTextAreaProps;
  showAllSchemesLinKText?: string;
  providerIcon?: ProviderIconBlockViewModel;
  operationalMessages: OperationalMessageViewModel[];
  url?: string;
  schemas?: SchemaDataViewModel[];
  breadcrumb: BreadcrumbViewModel;
}
