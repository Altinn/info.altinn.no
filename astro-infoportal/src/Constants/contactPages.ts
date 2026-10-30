import type { ContactPageVariant } from "@components/Pages/ContactPage/ContactPage.types";
import { type Locale, t } from "@i18n/index";

export const contactPagePaths: Record<
  Locale,
  Record<ContactPageVariant, string>
> = {
  nb: {
    altinn: "/hjelp/skriv-til-oss/altinn/",
    business: "/hjelp/skriv-til-oss/bedrift/",
  },
  nn: {
    altinn: "/nn/hjelp/skriv-til-oss/altinn/",
    business: "/nn/hjelp/skriv-til-oss/bedrift/",
  },
  en: {
    altinn: "/en/help/write-to-us/altinn/",
    business: "/en/help/write-to-us/business/",
  },
};

const lastEightDigits = (value?: string) =>
  (value ?? "").replace(/\D/g, "").slice(-8);

// Umbraco has no field telling the help page's contact blocks apart, so the
// block showing the business guidance phone number gets the business form.
export function getContactPageUrl(
  contactNumber: string | undefined,
  locale: Locale,
) {
  const isBusiness =
    !!contactNumber &&
    lastEightDigits(contactNumber) ===
      lastEightDigits(t("contactPage.business.phone", locale));
  return contactPagePaths[locale][isBusiness ? "business" : "altinn"];
}
