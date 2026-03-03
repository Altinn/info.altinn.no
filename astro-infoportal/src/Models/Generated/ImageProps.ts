/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

import { IReactProps } from "./IReactProps";
import { IReactComponentProps } from "./IReactComponentProps";
import { BaseReactComponentProps } from "./BaseReactComponentProps";
import { ImageSourceProps } from "./ImageSourceProps";

export interface ImageProps extends IReactProps, IReactComponentProps, BaseReactComponentProps {
  src?: string;
  imageSources?: ImageSourceProps[];
  description?: string;
  altText?: string;
  copyrightText?: string;
}
