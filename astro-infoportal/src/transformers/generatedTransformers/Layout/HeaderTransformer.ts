import type { IJSONTransformer } from "../IJSONTransformer";

export class HeaderTransformer implements IJSONTransformer {
    public Transform(cmsPageData:any):any {
        /* C# logic (TS-ish++):
        const startpage: parameters.StartPage;
                if (startpage: = null)
                    return BuildEmptyHeader();
        
        
                const culture: CultureInfo.CurrentCulture.NormalizeCulture();
        
                const currentpage: parameters.CurrentPage;
        
                languageService.SetSBLLanguageCookie(httpContextAccessor.HttpContext);
        
        
                // Get environment-specific Altinn URLs
                const amuiBaseUrl: environmentResolver.GetAmUiBaseUrl();
                const afbaseUrl: environmentResolver.GetAfBaseUrl();
                const platformbaseUrl: environmentResolver.GetPlatformBaseUrl();
                const hostbaseUrl: environmentResolver.GetHostBaseUrl();
        
                const loginurl: afBaseUrl;
                const inboxurl: afBaseUrl ; 
                const profileurl: `{afBaseUrl}/profile`;
                const accessmanagementUrl: `{amUiBaseUrl}/accessmanagement/ui`;
                const logouturl: `{platformBaseUrl}/authentication/api/v1/logout`;
        
                const languages: new (string code, string img, string name)[]
                {
                    ("no", "/Static/img/no.svg", "Bokm\\u00E5l"),
                    ("nn-no", "/Static/img/no.svg", "Nynorsk"),
                    ("en", "/Static/img/gb.svg", "English")
                };
        
                const menulanguageList: languages
                    .map(x: > MapLanguageItemViewModel(currentPage, x.code, x.img, x.name, culture.Name.Equals(x.code, StringComparison.OrdinalIgnoreCase)))
                    ;
        
                return {
                    startAndRunCompany: BuildLink("/menu/startcompany", startPage.StartAndRunCompany, culture),
                    helpPage: BuildLink("/menu/help", startPage.HelpPage, culture),
                    loginPage: BuildLink("/menu/login/title", new Uri(loginUrl), culture),
                    schemaOverviewPage: BuildLinkToSchemaOverviewPage(culture),
                    inboxPage: BuildLink("/menu/inbox", new Uri(inboxUrl), culture),
                    accessManagementPage: BuildLink("/menu/accessmanagement", new Uri(accessManagementUrl), culture),
                    profilePage: BuildLink("/menu/profile", new Uri(profileUrl), culture),
                    logOutPage: BuildLink("/menu/logout", new Uri(logoutUrl), culture),
                    aboutNewAltinnPage: BuildLink("/menu/aboutnewaltinn", startPage.AboutNewAltinnReference, culture),
                    startPage: BuildLink("", startPage.ContentLink, culture),
                    loggedInAsText: localizationService.GetStringByCulture("/menu/loggedinas", culture),
                    backButtonText: localizationService.GetStringByCulture("/menu/backbutton", culture),
                    menuLanguageList: menuLanguageList,
                    shortcutText: localizationService.GetStringByCulture("/menu/shortcut", culture),
                    chooseLanguageText: localizationService.GetStringByCulture("/common/chooselanguage", culture),
                    menuText: localizationService.GetStringByCulture("/menu/menulabel", culture),
                    searchTextPlaceholder: localizationService.GetStringByCulture("/search/search", culture),
                    searchPageUrl: urlResolver.GetUrl(startPage.SearchPage, culture.Name),
                    searchMenuText: localizationService.GetStringByCulture("/menu/searchinaltinn", culture),
                    suggestionsTitle: localizationService.GetStringByCulture("/search/suggestions", culture),
                    dateOfBirthText: localizationService.GetStringByCulture("/menu/dateofbirth", culture),
                    orgNrText: localizationService.GetStringByCulture("/menu/orgnr", culture),
                    useSearchSuggestions: startPage.UseSearchSuggestions,
                    hostBaseUrl: hostBaseUrl,
                    banner: startPage.Banner != null ? bannerBlockViewModelBuilder.Build(startPage.Banner) : null
                }
        */
                const props = cmsPageData?.properties ?? {};
        let bodyData = {
            componentName: "Header",
            startAndRunCompany: props?.startAndRunCompany ?? null,
            helpPage: props?.helpPage ?? null,
            loginPage: props?.loginPage ?? null,
            schemaOverviewPage: props?.schemaOverviewPage ?? null,
            inboxPage: props?.inboxPage ?? null,
            accessManagementPage: props?.accessManagementPage ?? null,
            profilePage: props?.profilePage ?? null,
            logOutPage: props?.logOutPage ?? null,
            aboutNewAltinnPage: props?.aboutNewAltinnPage ?? null,
            startPage: props?.startPage ?? null,
            loggedInAsText: props?.loggedInAsText ?? null,
            backButtonText: props?.backButtonText ?? null,
            menuLanguageList: props?.menuLanguageList ?? null,
            shortcutText: props?.shortcutText ?? null,
            chooseLanguageText: props?.chooseLanguageText ?? null,
            menuText: props?.menuText ?? null,
            searchTextPlaceholder: props?.searchTextPlaceholder ?? null,
            searchPageUrl: props?.searchPageUrl ?? null,
            searchMenuText: props?.searchMenuText ?? null,
            suggestionsTitle: props?.suggestionsTitle ?? null,
            dateOfBirthText: props?.dateOfBirthText ?? null,
            orgNrText: props?.orgNrText ?? null,
            useSearchSuggestions: props?.useSearchSuggestions ?? null,
            hostBaseUrl: props?.hostBaseUrl ?? null,
            banner: props?.banner ?? null,
        };

        return bodyData;
    }
}







