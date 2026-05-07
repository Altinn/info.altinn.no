import {
  fetchUmbracoContent,
  fetchUmbracoContentList,
  fetchUmbracoStartPage,
} from "@api/umbraco/client";
import { t, type Locale } from "@i18n/index";

const CONTACT_FORM_SCHEMA_ID_BY_SUPPORT_EMAIL: Record<string, number> = {
  "support@altinn.no": 31158,
  "altinn.starteogdrive@brreg.no": 31157,
};

const defaultContactFormPageCache = new Map<Locale, Promise<any>>();

function normalizeRichTextArea(value: any) {
  if (!value) {
    return null;
  }

  if (value.componentName === "RichTextArea") {
    return value;
  }

  if (Array.isArray(value.items)) {
    return {
      componentName: "RichTextArea",
      items: value.items,
    };
  }

  return value;
}

function buildContactFormLabels(locale: Locale) {
  return {
    nameLabel: t("contactform.name", locale),
    namePlaceholder: t("contactform.namePlaceholder", locale),
    nameValidation: t("contactform.nameRequired", locale),
    emailLabel: t("contactform.email", locale),
    emailPlaceholder: t("contactform.emailPlaceholder", locale),
    emailValidation: t("contactform.emailRequired", locale),
    confirmEmailLabel: t("contactform.confirmEmail", locale),
    confirmEmailPlaceholder: t("contactform.confirmEmailPlaceholder", locale),
    confirmEmailValidation: t("contactform.confirmEmailError", locale),
    phoneLabel: t("contactform.phone", locale),
    phonePlaceholder: t("contactform.phonePlaceholder", locale),
    phoneValidation: t("contactform.phoneRegex", locale),
    topicLabel: t("contactform.topic", locale),
    topicPlaceholder: t("contactform.topicPlaceholder", locale),
    messageLabel: t("contactform.message", locale),
    messagePlaceholder: t("contactform.messagePlaceholder", locale),
    messageDescription: t("contactform.messageDescription", locale),
    attachmentLabel: t("contactform.attachment", locale),
    attachmentButton: t("contactform.attachmentText", locale),
    attachmentDelete: t("contactform.attachmentDelete", locale),
    attachmentSizeError: t("contactform.fileSizeInvalid", locale),
    attachmentExtensionError: t("contactform.fileExtensionInvalid", locale),
    submitButton: t("contactform.button", locale),
    submitting: t("contactform.submitting", locale),
    closeButton: t("contactform.close", locale),
    successMessage: t("contactform.successMessage", locale),
    errorMessage: t("contactform.errorMessage", locale),
    retryButton: t("contactform.retryButton", locale),
  };
}

function buildFormId(sourceId?: string) {
  const normalized = (sourceId || "contact-form").replace(/[^a-zA-Z0-9]/g, "");
  return `form-${normalized.toLowerCase()}`;
}

async function getStartPageData(locale: Locale, startPageData?: any) {
  if (startPageData) {
    return startPageData;
  }

  return fetchUmbracoStartPage(locale);
}

async function getDefaultContactFormPageData(locale: Locale, startPageData?: any) {
  const cached = defaultContactFormPageCache.get(locale);
  if (cached) {
    return cached;
  }

  const loadPromise = (async () => {
    const pages = await fetchUmbracoContentList(["contentType:contactFormPage"], 1, locale);
    const page = pages?.[0];

    if (!page) {
      return undefined;
    }

    return hydrateContactFormPageData(page, locale, startPageData);
  })();

  defaultContactFormPageCache.set(locale, loadPromise);
  return loadPromise;
}

async function fetchReferencedContent(reference: any, locale: Locale) {
  const target = reference?.route?.path || reference?.id;

  if (!target) {
    return reference;
  }

  return fetchUmbracoContent(target, locale);
}

async function hydrateContactFormBlock(
  rawBlock: any,
  locale: Locale,
  startPageData?: any,
) {
  const blockData = await fetchReferencedContent(rawBlock, locale);
  const props = blockData?.properties ?? rawBlock?.properties ?? {};
  const startProps = startPageData?.properties ?? {};

  return {
    componentName: "ContactFormBlock",
    heading: props.heading ?? blockData?.name ?? rawBlock?.name ?? null,
    contactHeading: props.contactHeading ?? null,
    text: props.contactHeading ?? props.text ?? null,
    showAttachment: props.showAttachment ?? false,
    startCompanyFormat: props.startCompanyFormat ?? false,
    supportEmail: props.supportEmail ?? null,
    locationSuccessUrl: props.locationSuccess?.[0]?.route?.path ?? "",
    locationErrorUrl: props.locationError?.[0]?.route?.path ?? "",
    formId: buildFormId(blockData?.id ?? rawBlock?.id),
    useRecaptcha: startProps.useRecaptcha ?? props.useRecaptcha ?? false,
    recaptchaSiteKey:
      startProps.reCaptchaSiteKey ?? props.recaptchaSiteKey ?? undefined,
    // Umbraco delivery omits the legacy numeric content id used by the submit endpoint.
    schemaId: CONTACT_FORM_SCHEMA_ID_BY_SUPPORT_EMAIL[props.supportEmail ?? ""] ?? 0,
    labels: buildContactFormLabels(locale),
    displayOptionId: rawBlock?.displayOptionId ?? "full",
    displayOptionName: rawBlock?.displayOptionName ?? "/displayoptions/full",
    displayOptionTag: rawBlock?.displayOptionTag ?? "col-sm-12",
  };
}

export async function hydrateContactFormPageData(
  rawPageData: any,
  locale: Locale,
  startPageData?: any,
) {
  if (!rawPageData) {
    return undefined;
  }

  const formTypeArea = rawPageData?.formTypeArea;
  if (
    rawPageData.componentName === "ContactFormPage" &&
    formTypeArea?.componentName === "ContentArea" &&
    Array.isArray(formTypeArea.items) &&
    formTypeArea.items.every((item: any) => item?.componentName)
  ) {
    return rawPageData;
  }

  const pageData = await fetchReferencedContent(rawPageData, locale);
  const pageProps = pageData?.properties ?? rawPageData?.properties ?? rawPageData;
  const startPage = await getStartPageData(locale, startPageData);
  const startProps = startPage?.properties ?? {};

  const rawItems = Array.isArray(pageProps?.formTypeArea)
    ? pageProps.formTypeArea
    : Array.isArray(pageProps?.formTypeArea?.items)
      ? pageProps.formTypeArea.items
      : [];

  const items = await Promise.all(
    rawItems.map((item: any) => hydrateContactFormBlock(item, locale, startPage)),
  );

  return {
    componentName: "ContactFormPage",
    pageName: pageData?.name ?? rawPageData?.pageName ?? null,
    teaserText: normalizeRichTextArea(pageProps?.teaserText ?? rawPageData?.teaserText),
    teaserHeading: pageProps?.teaserHeading ?? rawPageData?.teaserHeading ?? null,
    formTypeArea: {
      componentName: "ContentArea",
      items,
    },
    useRecaptcha: startProps.useRecaptcha ?? pageProps?.useRecaptcha ?? false,
    recaptchaSiteKey:
      startProps.reCaptchaSiteKey ?? pageProps?.recaptchaSiteKey ?? undefined,
  };
}

export async function hydrateNestedContactFormPageData(
  value: any,
  locale: Locale,
  startPageData?: any,
): Promise<any> {
  if (Array.isArray(value)) {
    return Promise.all(
      value.map((item) => hydrateNestedContactFormPageData(item, locale, startPageData)),
    );
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  if (value.componentName === "ContactFormPage" || value.contentType === "contactFormPage") {
    return hydrateContactFormPageData(value, locale, startPageData);
  }

  const entries = await Promise.all(
    Object.entries(value).map(async ([key, nestedValue]) => {
      if (key === "contactFormPageData") {
        return [key, await hydrateContactFormPageData(nestedValue, locale, startPageData)] as const;
      }

      return [key, await hydrateNestedContactFormPageData(nestedValue, locale, startPageData)] as const;
    }),
  );

  const hydratedValue = Object.fromEntries(entries);

  const expectsContactFormPageData =
    (hydratedValue.componentName === "DoYouNeedHelpBlock" && hydratedValue.showContactFormButton) ||
    (hydratedValue.componentName === "ContactListBlock" && hydratedValue.useContactFormButton);

  if (expectsContactFormPageData && !hydratedValue.contactFormPageData) {
    hydratedValue.contactFormPageData = await getDefaultContactFormPageData(
      locale,
      startPageData,
    );
  }

  return hydratedValue;
}