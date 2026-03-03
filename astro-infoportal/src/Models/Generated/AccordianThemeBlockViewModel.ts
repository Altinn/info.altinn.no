/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

import { IReactProps } from "./IReactProps";
import { IReactComponentProps } from "./IReactComponentProps";
import { BaseReactComponentProps } from "./BaseReactComponentProps";
import { ContentAreaProps } from "./ContentAreaProps";
import { LinkItemViewModel } from "./LinkItemViewModel";
import { ImageProps } from "./ImageProps";

export interface AccordianThemeBlockViewModel extends IReactProps, IReactComponentProps, BaseReactComponentProps {
  heading?: string;
  themePageArea?: ContentAreaProps;
  goToLinkLocation?: LinkItemViewModel;
  goToLinkText?: string;
  image?: ImageProps;
}
