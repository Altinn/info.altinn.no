/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

import { IReactProps } from "./IReactProps";
import { IReactComponentProps } from "./IReactComponentProps";
import { BaseReactComponentProps } from "./BaseReactComponentProps";
import { BreadcrumbViewModel } from "./BreadcrumbViewModel";
import { OperationalMessageArticleItemViewModel } from "./OperationalMessageArticleItemViewModel";
import { ContentAreaProps } from "./ContentAreaProps";

export interface OperationalMessageArchivePageViewModel extends IReactProps, IReactComponentProps, BaseReactComponentProps {
  pageName?: string;
  breadcrumb: BreadcrumbViewModel;
  articles: OperationalMessageArticleItemViewModel[];
  bottomContentArea?: ContentAreaProps;
}
