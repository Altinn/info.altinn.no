/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

import { IReactProps } from "./IReactProps";
import { IReactComponentProps } from "./IReactComponentProps";
import { BaseReactComponentProps } from "./BaseReactComponentProps";
import { ImageProps } from "./ImageProps";
import { LinkItemViewModel } from "./LinkItemViewModel";
import { RichTextAreaProps } from "./RichTextAreaProps";

export interface PromoBoxBlockViewModel extends IReactProps, IReactComponentProps, BaseReactComponentProps {
  image?: ImageProps;
  imageAltText?: string;
  link?: LinkItemViewModel;
  text?: RichTextAreaProps;
}
