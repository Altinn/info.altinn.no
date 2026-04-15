export interface ProviderContactInformationBlockProps {
  body?: Record<string, unknown>;
  bottomText?: Record<string, unknown>;
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
