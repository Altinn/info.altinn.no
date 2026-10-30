import {
  fetchUmbracoContent,
  fetchUmbracoContentList,
} from "@api/umbraco/client";
import { getContactPageUrl } from "@constants/contactPages";
import type { Locale } from "@i18n/index";

export interface ContactFormBlockData {
  schemaId: string;
  startCompanyFormat: boolean;
}

const contactFormBlocksCache = new Map<
  Locale,
  Promise<ContactFormBlockData[]>
>();

async function fetchReferencedContent(reference: any, locale: Locale) {
  const target = reference?.route?.path || reference?.id;

  if (!target) {
    return reference;
  }

  return fetchUmbracoContent(target, locale);
}

async function loadContactFormBlocks(locale: Locale) {
  const pages = await fetchUmbracoContentList(
    ["contentType:contactFormPage"],
    1,
    locale,
  );
  const page = await fetchReferencedContent(pages?.[0], locale);
  const formTypeArea = page?.properties?.formTypeArea;
  const rawItems: any[] = Array.isArray(formTypeArea)
    ? formTypeArea
    : Array.isArray(formTypeArea?.items)
      ? formTypeArea.items
      : [];

  return Promise.all(
    rawItems.map(async (rawBlock) => {
      const blockData =
        rawBlock?.content ?? (await fetchReferencedContent(rawBlock, locale));
      const props = blockData?.properties ?? rawBlock?.properties ?? {};
      return {
        // Umbraco GUID of the contactFormBlock — backend looks up supportEmail from this.
        schemaId: blockData?.id ?? rawBlock?.id ?? "",
        startCompanyFormat: !!props.startCompanyFormat,
      };
    }),
  );
}

export function getContactFormBlocks(locale: Locale) {
  const cached = contactFormBlocksCache.get(locale);
  if (cached) {
    return cached;
  }

  const loadPromise = loadContactFormBlocks(locale);
  contactFormBlocksCache.set(locale, loadPromise);
  return loadPromise;
}

export function addContactPageUrls(value: any, locale: Locale): any {
  if (Array.isArray(value)) {
    return value.map((item) => addContactPageUrls(item, locale));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const result = Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => [
      key,
      addContactPageUrls(nestedValue, locale),
    ]),
  );

  if (
    result.componentName === "ContactListBlock" &&
    result.contactFormLocation
  ) {
    result.contactPageUrl ??= getContactPageUrl(result.contactNumber, locale);
  }

  if (
    result.componentName === "DoYouNeedHelpBlock" &&
    result.showContactFormButton
  ) {
    result.contactPageUrl ??= getContactPageUrl(result.phoneNumber, locale);
  }

  return result;
}
