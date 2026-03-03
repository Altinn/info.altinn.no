/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

import { IReactProps } from "./IReactProps";
import { IReactComponentProps } from "./IReactComponentProps";
import { BaseReactComponentProps } from "./BaseReactComponentProps";
import { NewsArticleItemViewModel } from "./NewsArticleItemViewModel";
import { ContentAreaProps } from "./ContentAreaProps";
import { BreadcrumbViewModel } from "./BreadcrumbViewModel";

export interface NewsArchivePageViewModel extends IReactProps, IReactComponentProps, BaseReactComponentProps {
  pageName?: string;
  newsArticles: NewsArticleItemViewModel[];
  totalResultCount: number;
  totalPages: number;
  currentPageNumber: number;
  lastPageText?: string;
  nextPageText?: string;
  bottomContentArea?: ContentAreaProps;
  breadcrumb: BreadcrumbViewModel;
}
