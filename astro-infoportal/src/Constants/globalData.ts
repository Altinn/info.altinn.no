// TODO: Replace with real Umbraco global data when backend supports it.
// This is shared between the catch-all route and static pages (e.g., search).

export function getGlobalData(searchPageUrl = "/sok/") {
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
        closeButtonText: "Lukk",
        contentHash: "88628bb068b41760",
        localStoragePrefix: "infoportal-banner-dismissed",
        componentName: "BannerBlock",
      },
      startAndRunCompany: { text: "Starte og drive bedrift", url: "/starte-og-drive/" },
      helpPage: { text: "Trenger du hjelp?", url: "/hjelp/" },
      loginPage: { text: "Logg inn", url: "https://af.at23.altinn.cloud/" },
      schemaOverviewPage: { text: "Alle skjema og tjenester", url: "/skjemaoversikt/" },
      inboxPage: { text: "Innboks", url: "https://af.at23.altinn.cloud/" },
      accessManagementPage: { text: "Tilgangsstyring", url: "https://am.ui.at23.altinn.cloud/accessmanagement/ui" },
      profilePage: { text: "Din profil", url: "https://af.at23.altinn.cloud/profile" },
      logOutPage: { text: "Logg ut", url: "https://platform.at23.altinn.cloud/authentication/api/v1/logout" },
      aboutNewAltinnPage: { text: "Om nye altinn", url: "/nyheter/om-nye-altinn/" },
      startPage: { text: "", url: "/" },
      loggedInAsText: "Logget inn som",
      backButtonText: "Tilbake",
      chooseLanguageText: "Velg språk",
      menuLanguageList: [
        { pageUrl: "/starte-og-drive/", languageTeaser: "Alt innhold er tilgjengelig på bokmål.", languageImage: "/Static/img/no.svg", languageName: "Bokmål", selected: true },
        { pageUrl: "/nn/starte-og-drive/", languageTeaser: "Noko av innhaldet er tilgjengeleg på nynorsk.", languageImage: "/Static/img/no.svg", languageName: "Nynorsk", selected: false },
        { pageUrl: "/en/start-and-run-business/", languageTeaser: "Some content is available in English.", languageImage: "/Static/img/gb.svg", languageName: "English", selected: false },
      ],
      shortcutText: "Snarveier",
      menuText: "Meny",
      searchTextPlaceholder: "Søk i innhold",
      searchPageUrl,
      suggestionsTitle: "Utvalgte hurtiglenker",
      useSearchSuggestions: false,
      dateOfBirthText: "Fødslesnummer",
      orgNrText: "Org. nr",
      hostBaseUrl: "https://at23.altinn.cloud/",
    },
    footerViewModel: {
      startAndRunCompany: { text: "Starte og drive bedrift", url: "/starte-og-drive/" },
      helpPage: { text: "Hjelp og kontakt", url: "/hjelp/" },
      address1: "Digitaliseringsdirektoratet,",
      address2: "Postboks 1382 Vika, 0114 Oslo. Org.nr. 991 825 827",
      aboutAltinnReference: { text: "Om Altinn", url: "/om-altinn/" },
      operationalMessagesReference: { text: "Driftsmeldinger", url: "/om-altinn/driftsmeldinger/" },
      privacyReference: { text: "Personvern", url: "/om-altinn/personvern/" },
      accessibilityLocation: { text: "Tilgjengelighet", url: "/om-altinn/tilgjengelighet/" },
      searchPageUrl,
      searchUrlBody: searchPageUrl,
    },
    skipLinkText: "Hopp til hovedinnhold",
  };
}
