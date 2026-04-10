import { t, type Locale } from "@i18n/index";

// TODO: Replace with real Umbraco global data when backend supports it.
// This is shared between the catch-all route and static pages (e.g., search).

export function getGlobalData(locale: Locale = "nb", searchPageUrl = "/sok/") {
  return {
    headerViewModel: {
      banner: {
        message: {
          items: [
            {
              html: "\u003cp\u003eVi fornyer Altinn.\u0026nbsp;\u003ca href=\u0022/nyheter/om-nye-altinn/\u0022 class=\u0022ds-link\u0022\u003eLes mer om hva som er nytt.\u003c/a\u003e\u003c/p\u003e",
              componentName: "RichText",
            },
          ],
          componentName: "RichTextArea",
        },
        isActive: true,
        badgeText: "Beta",
        colorTheme: "accent",
        closeButtonText: t("banner.closeButton", locale),
        contentHash: "88628bb068b41760",
        localStoragePrefix: "infoportal-banner-dismissed",
        componentName: "BannerBlock",
      },
      startAndRunCompany: { text: t("header.startAndRunCompany", locale), url: "/starte-og-drive/" },
      helpPage: { text: t("header.help", locale), url: "/hjelp/" },
      loginPage: { text: t("header.login", locale), url: "https://af.at23.altinn.cloud/" },
      schemaOverviewPage: { text: t("header.allSchemas", locale), url: "/skjemaoversikt/" },
      inboxPage: { text: t("header.inbox", locale), url: "https://af.at23.altinn.cloud/" },
      accessManagementPage: { text: t("header.accessManagement", locale), url: "https://am.ui.at23.altinn.cloud/accessmanagement/ui" },
      profilePage: { text: t("header.profile", locale), url: "https://af.at23.altinn.cloud/profile" },
      logOutPage: { text: t("header.logout", locale), url: "https://platform.at23.altinn.cloud/authentication/api/v1/logout" },
      aboutNewAltinnPage: { text: t("header.aboutNewAltinn", locale), url: "/nyheter/om-nye-altinn/" },
      startPage: { text: "", url: "/" },
      loggedInAsText: t("header.loggedInAs", locale),
      backButtonText: t("header.back", locale),
      chooseLanguageText: t("header.chooseLanguage", locale),
      // languageTeaser and languageName are not locale-dependent — each describes
      // the language in its own language. Not provided by Umbraco, so hardcoded here.
      menuLanguageList: [
        { pageUrl: "/starte-og-drive/", languageTeaser: "Alt innhold er tilgjengelig på bokmål.", languageImage: "/Static/img/no.svg", languageName: "Bokmål", selected: true },
        { pageUrl: "/nn/starte-og-drive/", languageTeaser: "Noko av innhaldet er tilgjengeleg på nynorsk.", languageImage: "/Static/img/no.svg", languageName: "Nynorsk", selected: false },
        { pageUrl: "/en/start-and-run-business/", languageTeaser: "Some content is available in English.", languageImage: "/Static/img/gb.svg", languageName: "English", selected: false },
      ],
      shortcutText: t("header.shortcuts", locale),
      menuText: t("header.menu", locale),
      searchTextPlaceholder: t("header.searchPlaceholder", locale),
      searchPageUrl,
      suggestionsTitle: t("header.suggestions", locale),
      useSearchSuggestions: false,
      dateOfBirthText: t("header.dateOfBirth", locale),
      orgNrText: t("header.orgNr", locale),
      hostBaseUrl: "https://at23.altinn.cloud/",
    },
    footerViewModel: {
      startAndRunCompany: { text: t("footer.startAndRunCompany", locale), url: "/starte-og-drive/" },
      helpPage: { text: t("footer.helpAndContact", locale), url: "/hjelp/" },
      address1: "Digitaliseringsdirektoratet,",
      address2: "Postboks 1382 Vika, 0114 Oslo. Org.nr. 991 825 827",
      aboutAltinnReference: { text: t("footer.aboutAltinn", locale), url: "/om-altinn/" },
      operationalMessagesReference: { text: t("footer.operationalMessages", locale), url: "/om-altinn/driftsmeldinger/" },
      privacyReference: { text: t("footer.privacy", locale), url: "/om-altinn/personvern/" },
      accessibilityLocation: { text: t("footer.accessibility", locale), url: "/om-altinn/tilgjengelighet/" },
      searchPageUrl,
      searchUrlBody: searchPageUrl,
    },
    skipLinkText: t("common.skipToContent", locale),
    locale,
  };
}
