/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

import { IReactProps } from "./IReactProps";
import { IReactComponentProps } from "./IReactComponentProps";
import { BaseReactComponentProps } from "./BaseReactComponentProps";
import { ContactFormLabels } from "./ContactFormLabels";

export interface ContactFormBlockViewModel extends IReactProps, IReactComponentProps, BaseReactComponentProps {
  heading?: string;
  contactHeading?: string;
  text?: string;
  showAttachment: boolean;
  startCompanyFormat: boolean;
  supportEmail?: string;
  locationSuccessUrl?: string;
  locationErrorUrl?: string;
  formId?: string;
  useRecaptcha: boolean;
  recaptchaSiteKey?: string;
  schemaId: number;
  labels?: ContactFormLabels;
}
