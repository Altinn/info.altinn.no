/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

import { IReactProps } from "./IReactProps";
import { IReactComponentProps } from "./IReactComponentProps";
import { BaseReactComponentProps } from "./BaseReactComponentProps";
import { ThemeGroupItemViewModel } from "./ThemeGroupItemViewModel";
import { ThemeArticleGroupViewModel } from "./ThemeArticleGroupViewModel";
import { ThemeContainerGroupViewModel } from "./ThemeContainerGroupViewModel";
import { ContentAreaProps } from "./ContentAreaProps";
import { BreadcrumbViewModel } from "./BreadcrumbViewModel";
import { SearchFormViewModel } from "./SearchFormViewModel";

export interface ThemePageViewModel extends IReactProps, IReactComponentProps, BaseReactComponentProps {
  pageName?: string;
  mainIntro?: string;
  themeGroups: ThemeGroupItemViewModel[];
  articleGroups: ThemeArticleGroupViewModel[];
  themeContainerGroups: ThemeContainerGroupViewModel[];
  bottomContentArea?: ContentAreaProps;
  breadcrumb: BreadcrumbViewModel;
  searchForm?: SearchFormViewModel;
}
