import type { ContentAreaProps } from "@components/Shared/ContentArea/ContentArea.types";
import type { RichTextAreaProps } from "@components/Shared/RichTextArea/RichTextArea.types";

export interface ContactFormLocationProps {
  text?: string;
  title?: string;
  url?: string;
  route?: { path?: string };
}

export interface ContactListBlockProps {
  contactHeading?: string;
  text?: RichTextAreaProps;
  button1?: unknown;
  useContactNumberButton?: boolean;
  contactNumber?: string;
  contactNumberText?: string;
  button2?: unknown;
  useContactFormButton?: boolean;
  contactFormLocation?: ContactFormLocationProps;
  button3?: unknown;
  contactFormPageData?: {
    pageName?: string;
    formTypeArea?: ContentAreaProps;
    teaserText?: string;
    teaserHeading?: string;
    useRecaptcha?: boolean;
    recaptchaSiteKey?: string;
  };
  contactFormSchemaId?: number;
  showAttachment?: boolean;
  useRecaptcha?: boolean;
  recaptchaSiteKey?: string;
  labels?: unknown;
}
