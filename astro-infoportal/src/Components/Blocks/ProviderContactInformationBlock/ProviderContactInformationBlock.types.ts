import type { RichTextAreaProps } from "@components/Shared/RichTextArea/RichTextArea.types";

export interface ProviderContactInformationBlockProps {
  body?: RichTextAreaProps;
  bottomText?: RichTextAreaProps;
  webpageLink?: {
    text?: string;
    url?: string;
  };
  telephone?: string;
  telephoneLabel?: string;
  email?: string;
  emailTitle?: string;
  pageName?: string;
  providerIcon?: {
    name?: string;
    imageUrl?: string;
  };
}
