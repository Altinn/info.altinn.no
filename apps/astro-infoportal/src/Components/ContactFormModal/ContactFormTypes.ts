import type { ContentAreaProps } from "@components/Shared/ContentArea/ContentArea.types";

export interface ContactFormModalProps {
  isOpen: boolean;
  onClose: () => void;

  // Mode 1: Single form (legacy - for backwards compatibility)
  schemaId?: number;
  showAttachment?: boolean;

  // Mode 2: Tabbed forms (new - matches ContactFormPage.cshtml)
  formTypeArea?: ContentAreaProps;
  teaserText?: any;
  teaserHeading?: string;

  // Shared props
  useRecaptcha: boolean;
  recaptchaSiteKey?: string;
  labels?: any;
  title?: string;
}

export interface ContactFormData {
  name: string;
  email: string;
  confirmEmail: string;
  phone?: string;
  subject: string;
  message: string;
  attachment?: File;
  location: string; // honeypot - must remain empty
  schemaId: number;
  language: string;
  recaptchaToken?: string;
}

export interface ContactFormApiResponse {
  success: boolean;
  errorMessage?: string;
}

export interface ContactFormErrors {
  name?: string;
  email?: string;
  confirmEmail?: string;
  phone?: string;
  subject?: string;
  message?: string;
  attachment?: string;
  general?: string;
}

export interface ContactFormLabels {
  nameLabel: string;
  namePlaceholder: string;
  nameValidation: string;
  emailLabel: string;
  emailPlaceholder: string;
  emailValidation: string;
  confirmEmailPlaceholder: string;
  confirmEmailLabel: string;
  confirmEmailValidation: string;
  phoneLabel: string;
  phonePlaceholder: string;
  phoneValidation: string;
  topicLabel: string;
  topicPlaceholder: string;
  messageLabel: string;
  messagePlaceholder: string;
  messageDescription: string;
  attachmentLabel: string;
  attachmentButton: string;
  attachmentDelete: string;
  attachmentSizeError: string;
  attachmentExtensionError: string;
  submitButton: string;
  submitting: string;
  closeButton: string;
  successMessage: string;
  errorMessage: string;
  retryButton: string;
}
