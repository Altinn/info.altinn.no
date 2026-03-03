/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

import { IReactProps } from "./IReactProps";
import { IReactComponentProps } from "./IReactComponentProps";
import { BaseReactComponentProps } from "./BaseReactComponentProps";
import { RichTextAreaProps } from "./RichTextAreaProps";
import { SchemaSubCategoryViewModel } from "./SchemaSubCategoryViewModel";
import { BreadcrumbViewModel } from "./BreadcrumbViewModel";
import { ContentAreaProps } from "./ContentAreaProps";

export interface CategoryPageViewModel extends IReactProps, IReactComponentProps, BaseReactComponentProps {
  pageName?: string;
  mainIntro?: RichTextAreaProps;
  icon: string;
  subCategories: SchemaSubCategoryViewModel[];
  breadcrumb: BreadcrumbViewModel;
  promoArea?: ContentAreaProps;
}
