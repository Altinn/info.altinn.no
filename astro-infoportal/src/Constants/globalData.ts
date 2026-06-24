import type { PlatformEndpoints } from "@api/altinn/environments";
import { resolveEnvironment } from "@api/altinn/environments";
import {
  buildMenuLanguageList,
  type CultureRoutes,
} from "@constants/languages";
import { SearchContext } from "@constants/searchContext";
import { CONSENT_REOPEN_HASH } from "@utils/consent";
import {
  buildBanner,
  buildLink,
  isHelpPageType,
  resolvePickerUrl,
} from "@constants/startPageLinks";
import { type Locale, t } from "@i18n/index";

export type ConsentBannerViewModel = {
  heading: string;
  bodyText: string;
  acceptLabel: string;
  rejectLabel: string;
  necessaryText: string;
  footerLinkText: string;
  changeLinkText?: string;
  changeLinkUrl?: string;
  necessaryLinkText?: string;
  necessaryLinkUrl?: string;
};

const asText = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

// Build the consent banner view model from the editor-controlled CMS property.
// Single source of truth: returns null (banner does not render) when the
// property is missing or any mandatory field is empty. There is no fallback.
// Mirrors buildBanner's handling of the Delivery API value shape.
export function buildConsentBanner(
  value: unknown,
): ConsentBannerViewModel | null {
  const first = Array.isArray(value) ? value[0] : value;
  const props = (
    first as { properties?: Record<string, unknown> } | null | undefined
  )?.properties;
  if (!props) return null;

  const heading = asText(props.heading);
  const bodyText = asText(props.bodyText);
  const acceptLabel = asText(props.acceptLabel);
  const rejectLabel = asText(props.rejectLabel);
  const necessaryText = asText(props.necessaryText);
  const footerLinkText = asText(props.footerLinkText);

  if (
    !heading ||
    !bodyText ||
    !acceptLabel ||
    !rejectLabel ||
    !necessaryText ||
    !footerLinkText
  ) {
    return null;
  }

  const changeLinkUrl = resolvePickerUrl(props.changeLink) ?? undefined;
  const necessaryLinkUrl = resolvePickerUrl(props.necessaryLink) ?? undefined;

  return {
    heading,
    bodyText,
    acceptLabel,
    rejectLabel,
    necessaryText,
    footerLinkText,
    changeLinkText: asText(props.changeLinkText) || undefined,
    changeLinkUrl,
    necessaryLinkText: asText(props.necessaryLinkText) || undefined,
    necessaryLinkUrl,
  };
}

export function getGlobalData(
  locale: Locale = "nb",
  searchPageUrl = "/sok/",
  endpoints: PlatformEndpoints = resolveEnvironment(null),
  cultures: CultureRoutes = {},
  startPage?: { properties?: Record<string, unknown> },
  currentPageContentType?: string,
  currentPath?: string,
  contentLocale: Locale = locale,
) {
  const afBase = endpoints.afBaseUrl.replace(/\/$/, "");
  const amUiBase = endpoints.amUiBaseUrl.replace(/\/$/, "");
  const platformBase = endpoints.platformBaseUrl.replace(/\/$/, "");
  const p = startPage?.properties;
  const consentBanner = buildConsentBanner(p?.consentBanner);

  return {
    headerViewModel: {
      banner: buildBanner(p?.banner, t("banner.closeButton", locale)),
      startAndRunCompany: buildLink(
        p?.startAndRunCompany,
        t("header.startAndRunCompany", locale),
      ),
      helpPage: buildLink(p?.helpPage, t("header.help", locale)),
      loginPage: { text: t("header.login", locale), url: `${afBase}/` },
      schemaOverviewPage: buildLink(
        p?.schemaReference,
        t("header.allSchemas", locale),
      ),
      inboxPage: { text: t("header.inbox", locale), url: `${afBase}/` },
      accessManagementPage: {
        text: t("header.accessManagement", locale),
        url: `${amUiBase}/accessmanagement/ui`,
      },
      profilePage: {
        text: t("header.profile", locale),
        url: `${afBase}/profile`,
      },
      logOutPage: {
        text: t("header.logout", locale),
        url: `${platformBase}/authentication/api/v1/logout`,
      },
      aboutNewAltinnPage: buildLink(
        p?.aboutNewAltinnReference,
        t("header.aboutNewAltinn", locale),
      ),
      startPage: { text: "", url: "/" },
      loggedInAsText: t("header.loggedInAs", locale),
      backButtonText: t("header.back", locale),
      chooseLanguageText: t("header.chooseLanguage", locale),
      menuLanguageList: buildMenuLanguageList(locale, cultures, currentPath),
      shortcutText: t("header.shortcuts", locale),
      menuText: t("header.menu", locale),
      searchTextPlaceholder: t("header.searchPlaceholder", locale),
      searchPageUrl,
      suggestionsTitle: t("header.suggestions", locale),
      useSearchSuggestions: false,
      dateOfBirthText: t("header.dateOfBirth", locale),
      orgNrText: t("header.orgNr", locale),
      hostBaseUrl: endpoints.hostBaseUrl,
    },
    footerViewModel: {
      startAndRunCompany: buildLink(
        p?.startAndRunCompany,
        t("footer.startAndRunCompany", locale),
      ),
      helpPage: buildLink(p?.helpPage, t("footer.helpAndContact", locale)),
      address1: (p?.address1 as string) ?? "",
      address2: (p?.address2 as string) ?? "",
      aboutAltinnReference: buildLink(
        p?.aboutAltinnReference,
        t("footer.aboutAltinn", locale),
      ),
      operationalMessagesReference: buildLink(
        p?.operationalMessagesReference,
        t("footer.operationalMessages", locale),
      ),
      privacyReference: buildLink(
        p?.privacyReference,
        t("footer.privacy", locale),
      ),
      accessibilityLocation: buildLink(
        p?.accessibilityLocation,
        t("footer.accessibility", locale),
      ),
      cookieConsent: consentBanner
        ? { text: consentBanner.footerLinkText, url: `#${CONSENT_REOPEN_HASH}` }
        : null,
      searchContext:
        currentPageContentType === "schemaOverviewPage"
          ? SearchContext.Schema
          : "",
      searchPageUrl,
      searchUrlBody: isHelpPageType(currentPageContentType)
        ? (resolvePickerUrl(p?.helpPage) ?? searchPageUrl)
        : searchPageUrl,
    },
    skipLinkText: t("common.skipToContent", locale),
    consentBanner,
    locale,
    contentLocale,
  };
}
