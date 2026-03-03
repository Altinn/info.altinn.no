/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

import { IReactProps } from "./IReactProps";
import { IReactComponentProps } from "./IReactComponentProps";
import { BaseReactComponentProps } from "./BaseReactComponentProps";
import { ImageProps } from "./ImageProps";
import { ContactFormLabels } from "./ContactFormLabels";
import { ContactFormPageViewModel } from "./ContactFormPageViewModel";

export interface DoYouNeedHelpBlockViewModel extends IReactProps, IReactComponentProps, BaseReactComponentProps {
  heading?: string;
  image?: ImageProps;
  imageAltText?: string;
  description?: string;
  phoneNumber?: string;
  emailLinkText?: string;
  email?: string;
  showContactFormButton: boolean;
  contactFormText?: string;
  labels?: ContactFormLabels;
  contactFormSchemaId: number;
  showAttachment: boolean;
  useRecaptcha: boolean;
  recaptchaSiteKey?: string;
  contactFormPageData?: ContactFormPageViewModel;
}
