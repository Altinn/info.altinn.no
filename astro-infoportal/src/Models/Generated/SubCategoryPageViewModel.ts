/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

import { IReactProps } from "./IReactProps";
import { IReactComponentProps } from "./IReactComponentProps";
import { BaseReactComponentProps } from "./BaseReactComponentProps";
import { RichTextAreaProps } from "./RichTextAreaProps";
import { TimelineItemBlockViewModel } from "./TimelineItemBlockViewModel";
import { SchemaDataViewModel } from "./SchemaDataViewModel";
import { BreadcrumbViewModel } from "./BreadcrumbViewModel";
import { ContentAreaProps } from "./ContentAreaProps";

export interface SubCategoryPageViewModel extends IReactProps, IReactComponentProps, BaseReactComponentProps {
  pageName?: string;
  description?: RichTextAreaProps;
  timelineHeading?: string;
  timeline: TimelineItemBlockViewModel[];
  schemas: SchemaDataViewModel[];
  breadcrumb: BreadcrumbViewModel;
  boxBlocks?: ContentAreaProps;
  accordions?: ContentAreaProps;
  promoArea?: ContentAreaProps;
}
