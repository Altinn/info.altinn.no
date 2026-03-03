/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

import { IReactProps } from "./IReactProps";
import { IReactComponentProps } from "./IReactComponentProps";
import { BaseReactComponentProps } from "./BaseReactComponentProps";
import { ImageProps } from "./ImageProps";

export interface QuoteWithImageBlockViewModel extends IReactProps, IReactComponentProps, BaseReactComponentProps {
  quote?: string;
  author?: string;
  image?: ImageProps;
  imageAltText?: string;
}
