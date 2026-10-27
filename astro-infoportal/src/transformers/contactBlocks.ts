import { getContactPageUrl } from "@constants/contactPages";
import { type Locale, t } from "@i18n/index";
import { resolveBlockReferences } from "../api/umbraco/client";
import { BlockTransformer } from "./BlockTransformer";

// Mirrors the legacy Optimizely ContactListBlockViewModelBuilder shape: i18n labels
// for contactNumberText, and contactFormLocation reshaped from a picker array into
// a LinkItem-ish object. contactFormPageData is attached by
// hydrateNestedContactFormPageData in JSONTransformer.
function mapContactListBlock(props: any, locale: Locale) {
  const locationRefs = Array.isArray(props.contactFormLocation)
    ? props.contactFormLocation
    : [];
  const firstLocation = locationRefs[0];
  const contactFormLocation = firstLocation
    ? {
        text: t("support.contactForm", locale),
        url: firstLocation?.route?.path,
        route: firstLocation?.route,
      }
    : undefined;

  return {
    componentName: "ContactListBlock",
    contactHeading: props.contactHeading ?? undefined,
    text: props.text ?? undefined,
    useContactNumberButton: props.useContactNumberButton ?? false,
    contactNumber: props.contactNumber ?? "",
    contactNumberText: t("support.contactTelephone", locale),
    useContactFormButton: props.useContactFormButton ?? false,
    contactFormLocation,
    contactPageUrl: contactFormLocation
      ? getContactPageUrl(props.contactNumber, locale)
      : undefined,
  };
}

// The help pages' "Sitter du fortsatt fast?" area. Umbraco only sends
// references to the picked blocks (`properties: {}`), so fetch each block
// first, then turn it into a component the ContentArea can render.
export async function buildContactBlocks(
  contactBlocks: any,
  locale: Locale,
  contentLocale: Locale,
  isPreview?: boolean,
) {
  const refs = await resolveBlockReferences(
    contactBlocks,
    contentLocale,
    isPreview,
  );

  const items = refs.map((item: any) => {
    if (item?.contentType === "contactListBlock") {
      return mapContactListBlock(item?.properties ?? {}, locale);
    }
    return BlockTransformer.TransformBlocks([item]).items[0];
  });

  return items.length ? { componentName: "ContentArea", items } : undefined;
}
