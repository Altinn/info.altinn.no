/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

import { IReactProps } from "./IReactProps";
import { IReactComponentProps } from "./IReactComponentProps";
import { BaseReactComponentProps } from "./BaseReactComponentProps";

export interface ContactFormLabels extends IReactProps, IReactComponentProps, BaseReactComponentProps {
  nameLabel?: string;
  namePlaceholder?: string;
  nameValidation?: string;
  emailLabel?: string;
  emailPlaceholder?: string;
  emailValidation?: string;
  emailRegex?: string;
  confirmEmailLabel?: string;
  confirmEmailPlaceholder?: string;
  confirmEmailValidation?: string;
  phoneLabel?: string;
  phonePlaceholder?: string;
  phoneValidation?: string;
  topicLabel?: string;
  topicRequired?: string;
  topicPlaceholder?: string;
  messageLabel?: string;
  messagePlaceholder?: string;
  messageDescription: string;
  attachmentLabel?: string;
  attachmentButton?: string;
  attachmentDelete?: string;
  attachmentSizeError?: string;
  attachmentExtensionError?: string;
  submitButton?: string;
  submitting?: string;
  closeButton?: string;
  successMessage?: string;
  errorMessage?: string;
  retryButton?: string;
}
