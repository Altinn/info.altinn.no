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
} from "@constants/startPageLinks";
import { type Locale, t } from "@i18n/index";

export type ConsentBannerViewModel = {
  footerLinkText: string;
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

  const footerLinkText = asText(props.footerLinkText);

  if (!footerLinkText) {
    return null;
  }

  return {
    footerLinkText,
  };
}

// Old-portal behaviour, restored: a page with no variant in the requested
// language renders its NB content (see `contentLocale` in [...slug].astro), and
// the reader is told so rather than being left to wonder why the page turned
// Norwegian. Returns null on any page that really is translated — the notice
// must never appear when nothing fell back.
//
// English only, by editorial decision (issue #648): nynorsk readers read bokmål,
// so the notice is noise there, and språklova requires many of these pages to
// exist in both målformer — a notice sitting on one for years reads as an
// excuse rather than help. The nn translation is kept in the locale files so the
// decision can be reversed without re-translating.
//
// This is page-level, matching the old portal. Individual fields that fall back
// on an otherwise-translated page (e.g. an untranslated driftsmelding on the
// localised front page, issue #672) are deliberately not covered: the page is
// translated, so a whole-page notice would misrepresent it.
export function buildMissingTranslationText(
  locale: Locale,
  contentLocale: Locale,
): string | null {
  if (locale !== "en" || locale === contentLocale) return null;
  return t("common.missingTranslation", locale);
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
      isPreview: (currentPath === "/preview")
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
    missingTranslationText: buildMissingTranslationText(locale, contentLocale),
    locale,
    contentLocale,
  };
}
