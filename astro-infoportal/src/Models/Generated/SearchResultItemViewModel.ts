/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

import { IReactProps } from "./IReactProps";
import { IReactComponentProps } from "./IReactComponentProps";
import { BaseReactComponentProps } from "./BaseReactComponentProps";

export interface SearchResultItemViewModel extends IReactProps, IReactComponentProps, BaseReactComponentProps {
  type?: string;
  isFallbackLanguage: boolean;
  title?: string;
  contentGuid?: string;
  score: number;
  hitId?: string;
  trackId?: string;
  url?: string;
}
