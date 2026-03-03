/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

import { IReactProps } from "./IReactProps";
import { IReactComponentProps } from "./IReactComponentProps";
import { BaseReactComponentProps } from "./BaseReactComponentProps";
import { LinkItemViewModel } from "./LinkItemViewModel";
import { ContentAreaProps } from "./ContentAreaProps";

export interface AboutPageViewModel extends IReactProps, IReactComponentProps, BaseReactComponentProps {
  pageName?: string;
  linkArea: LinkItemViewModel[];
  contactArea?: ContentAreaProps;
}
