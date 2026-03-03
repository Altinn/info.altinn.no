/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

import { IReactProps } from "./IReactProps";
import { IReactComponentProps } from "./IReactComponentProps";
import { BaseReactComponentProps } from "./BaseReactComponentProps";
import { RichTextAreaProps } from "./RichTextAreaProps";

export interface BannerBlockViewModel extends IReactProps, IReactComponentProps, BaseReactComponentProps {
  message?: RichTextAreaProps;
  isActive: boolean;
  badgeText?: string;
  colorTheme?: string;
  closeButtonText?: string;
  contentHash?: string;
  localStoragePrefix?: string;
}
