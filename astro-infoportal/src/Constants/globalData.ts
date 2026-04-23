import type { PlatformEndpoints } from "@api/altinn/environments";
import { resolveEnvironment } from "@api/altinn/environments";
import {
  buildMenuLanguageList,
  type CultureRoutes,
} from "@constants/languages";
import { SearchContext } from "@constants/searchContext";
import {
  buildBanner,
  buildLink,
  isHelpPageType,
  resolvePickerUrl,
} from "@constants/startPageLinks";
import { type Locale, t } from "@i18n/index";

export function getGlobalData(
  locale: Locale = "nb",
  searchPageUrl = "/sok/",
  endpoints: PlatformEndpoints = resolveEnvironment(null),
  cultures: CultureRoutes = {},
  startPage?: { properties?: Record<string, unknown> },
  currentPageContentType?: string,
) {
  const afBase = endpoints.afBaseUrl.replace(/\/$/, "");
  const amUiBase = endpoints.amUiBaseUrl.replace(/\/$/, "");
  const platformBase = endpoints.platformBaseUrl.replace(/\/$/, "");
  const p = startPage?.properties;

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
      menuLanguageList: buildMenuLanguageList(locale, cultures),
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
    locale,
  };
}
