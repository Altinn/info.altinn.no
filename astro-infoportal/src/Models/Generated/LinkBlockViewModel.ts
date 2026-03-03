/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

import { IReactProps } from "./IReactProps";
import { IReactComponentProps } from "./IReactComponentProps";
import { BaseReactComponentProps } from "./BaseReactComponentProps";
import { UrlBlockViewModel } from "./UrlBlockViewModel";

export interface LinkBlockViewModel extends IReactProps, IReactComponentProps, BaseReactComponentProps {
  fullWidth: boolean;
  icon?: string;
  extraTitle?: string;
  link?: UrlBlockViewModel;
}
