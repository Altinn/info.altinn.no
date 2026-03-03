/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

import { IReactProps } from "./IReactProps";
import { IReactComponentProps } from "./IReactComponentProps";
import { BaseReactComponentProps } from "./BaseReactComponentProps";
import { RichTextAreaProps } from "./RichTextAreaProps";
import { LinkItemViewModel } from "./LinkItemViewModel";
import { ImageProps } from "./ImageProps";

export interface AdvisorStartBlockViewModel extends IReactProps, IReactComponentProps, BaseReactComponentProps {
  heading?: string;
  mainBody?: RichTextAreaProps;
  linkLocation?: LinkItemViewModel;
  buttonText?: string;
  image?: ImageProps;
  imageAltText?: string;
}
