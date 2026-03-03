/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

import { IReactProps } from "./IReactProps";
import { IReactComponentProps } from "./IReactComponentProps";
import { SearchResultItemViewModel } from "./SearchResultItemViewModel";
import { ProviderIconBlockViewModel } from "./ProviderIconBlockViewModel";

export interface SchemaResultItemViewModel extends IReactProps, IReactComponentProps, SearchResultItemViewModel {
  isAttachment?: string;
  code?: string;
  providers: ProviderIconBlockViewModel[];
  ingress?: string;
}
