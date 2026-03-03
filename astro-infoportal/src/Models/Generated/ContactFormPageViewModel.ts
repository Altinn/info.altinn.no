/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

import { IReactProps } from "./IReactProps";
import { IReactComponentProps } from "./IReactComponentProps";
import { BaseReactComponentProps } from "./BaseReactComponentProps";
import { RichTextAreaProps } from "./RichTextAreaProps";
import { ContentAreaProps } from "./ContentAreaProps";

export interface ContactFormPageViewModel extends IReactProps, IReactComponentProps, BaseReactComponentProps {
  pageName?: string;
  teaserText?: RichTextAreaProps;
  teaserHeading?: string;
  formTypeArea?: ContentAreaProps;
  useRecaptcha: boolean;
  recaptchaSiteKey?: string;
}
