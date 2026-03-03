/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

import { IReactProps } from "./IReactProps";
import { IReactComponentProps } from "./IReactComponentProps";
import { BaseReactComponentProps } from "./BaseReactComponentProps";
import { RichTextAreaProps } from "./RichTextAreaProps";
import { LinkItemViewModel } from "./LinkItemViewModel";
import { ContactFormLabels } from "./ContactFormLabels";
import { ContactFormPageViewModel } from "./ContactFormPageViewModel";

export interface ContactListBlockViewModel extends IReactProps, IReactComponentProps, BaseReactComponentProps {
  contactHeading?: string;
  text?: RichTextAreaProps;
  button1?: LinkItemViewModel;
  useContactNumberButton: boolean;
  contactNumberText?: string;
  contactNumber?: string;
  button2?: LinkItemViewModel;
  useContactFormButton: boolean;
  contactFormLocation?: LinkItemViewModel;
  button3?: LinkItemViewModel;
  labels?: ContactFormLabels;
  contactFormSchemaId: number;
  showAttachment: boolean;
  useRecaptcha: boolean;
  recaptchaSiteKey?: string;
  contactFormPageData?: ContactFormPageViewModel;
}
