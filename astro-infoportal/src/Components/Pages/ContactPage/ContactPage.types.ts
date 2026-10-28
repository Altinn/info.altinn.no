export type ContactPageVariant = "altinn" | "business";

export interface ContactPageTexts {
  heading: string;
  alertHeading?: string;
  alertText?: string;
  alertPhone?: string;
  successHeading: string;
  successText: string;
  phone: string;
  required: string;
  optional: string;
  name: string;
  email: string;
  phoneLabel: string;
  orgNumber: string;
  subject: string;
  subjectOptions: string[];
  message: string;
  messageDescription: string;
  attachment: string;
  attachmentDescription: string;
  attachmentButton: string;
  attachmentDelete: string;
  attachmentSizeError: string;
  attachmentExtensionError: string;
  nameRequired: string;
  emailRequired: string;
  emailInvalid: string;
  phoneInvalid: string;
  orgNumberInvalid: string;
  subjectRequired: string;
  messageRequired: string;
  errorSummaryHeading: string;
  sendError: string;
  submit: string;
  submitting: string;
}

export interface ContactPageProps {
  variant: ContactPageVariant;
  schemaId: string;
  showAttachment: boolean;
  breadcrumb?: any;
  texts: ContactPageTexts;
}
