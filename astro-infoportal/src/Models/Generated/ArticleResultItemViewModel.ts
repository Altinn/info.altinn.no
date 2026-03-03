/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

import { IReactProps } from "./IReactProps";
import { IReactComponentProps } from "./IReactComponentProps";
import { SearchResultItemViewModel } from "./SearchResultItemViewModel";
import { ParentContextViewModel } from "./ParentContextViewModel";

export interface ArticleResultItemViewModel extends IReactProps, IReactComponentProps, SearchResultItemViewModel {
  tagName?: string;
  ingress?: string;
  parentContext?: ParentContextViewModel;
}
