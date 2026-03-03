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

export interface EGuideStartBlockViewModel extends IReactProps, IReactComponentProps, BaseReactComponentProps {
  heading?: string;
  mainBody?: RichTextAreaProps;
  guideLocation?: LinkItemViewModel;
  isGuidePage: boolean;
  image?: ImageProps;
  imageAltText?: string;
  startGuideText?: string;
}
