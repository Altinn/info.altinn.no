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
  contactPageUrl?: string;
  button3?: unknown;
}
