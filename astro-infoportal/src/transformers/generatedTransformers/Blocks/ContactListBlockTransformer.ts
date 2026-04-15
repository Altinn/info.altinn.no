import type { ContactListBlockProps } from "@components/Blocks/ContactListBlock/ContactListBlock.types";
import { type Locale, t } from "@i18n/index";
import type { IJSONTransformer } from "../../IJSONTransformer";

export class ContactListBlockTransformer implements IJSONTransformer {
  public Transform(
    cmsPageData: { properties?: ContactListBlockProps },
    context?: { locale?: Locale },
  ): any {
    const props = cmsPageData?.properties ?? {};
    const locale: Locale = context?.locale || "nb";

    const contactFormLocation = props.contactFormLocation
      ? {
          ...props.contactFormLocation,
          text:
            props.contactFormLocation.text ||
            props.contactFormLocation.title ||
            t("support.contactForm", locale),
          url:
            props.contactFormLocation.url ||
            props.contactFormLocation.route?.path ||
            "#",
        }
      : null;

    return {
      componentName: "ContactListBlock",
      contactHeading: props.contactHeading ?? null,
      text: props.text ?? null,
      button1: props.button1 ?? null,
      useContactNumberButton: props.useContactNumberButton ?? null,
      contactNumber: props.contactNumber ?? null,
      contactNumberText:
        props.contactNumberText || t("support.contactTelephone", locale),
      button2: props.button2 ?? null,
      useContactFormButton: props.useContactFormButton ?? null,
      contactFormLocation,
      button3: props.button3 ?? null,
      contactFormPageData: props.contactFormPageData ?? null,
      contactFormSchemaId: props.contactFormSchemaId ?? null,
      showAttachment: props.showAttachment ?? null,
      useRecaptcha: props.useRecaptcha ?? null,
      recaptchaSiteKey: props.recaptchaSiteKey ?? null,
      labels: props.labels ?? null,
    };
  }
}
