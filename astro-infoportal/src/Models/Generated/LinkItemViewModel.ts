/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

import { IReactProps } from "./IReactProps";
import { IReactComponentProps } from "./IReactComponentProps";
import { BaseReactComponentProps } from "./BaseReactComponentProps";
import { ImageProps } from "./ImageProps";

export interface LinkItemViewModel extends IReactProps, IReactComponentProps, BaseReactComponentProps {
  text?: string;
  description?: string;
  url?: string;
  target?: string;
  externalLinkDomain?: string;
  isExternal?: boolean;
  image?: ImageProps;
  preamble?: string;
}
