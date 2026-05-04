import type { IJSONTransformer } from "../IJSONTransformer";

export class FooterTransformer implements IJSONTransformer {
    public Transform(cmsPageData:any):any {
        /* C# logic (TS-ish++):
        const startpage: parameters.StartPage;
                if (startpage: = null)
                    return BuildEmptyFooter();
        
                const searchreference: isIHelpPage(parameters.CurrentPage) 
                    ? startPage.helpSearchPage: startPage.SearchPage;
        
                const searchcontext: isSchemaOverviewPage(parameters.CurrentPage) 
                    ? SearchContextHelper.SearchContext.Schema.ToString().ToLower() 
                    : "";
        
                const culture: CultureInfo.CurrentCulture.NormalizeCulture();
        
                return {
                    startAndRunCompany: BuildLink("/menu/startcompany", startPage.StartAndRunCompany, culture),
                    helpPage: BuildLink("/menu/helptext", startPage.HelpPage, culture),
                    address1: startPage.Address1,
                    address2: startPage.Address2,
                    aboutAltinnReference: BuildLink("/menu/aboutaltinn", startPage.AboutAltinnReference, culture),
                    operationalMessagesReference: BuildLink("/menu/operationalmessages", startPage.OperationalMessagesReference, culture),
                    privacyReference: BuildLink("/menu/privacy", startPage.PrivacyReference, culture),
                    accessibilityLocation: BuildLink("/menu/accessibility", startPage.AccessibilityLocation, culture),
                    searchContext: searchContext,
                    searchUrlBody: urlResolver.GetUrl(searchReference),
                    searchPageUrl: urlResolver.GetUrl(startPage.SearchPage)
                }
        */
                const props = cmsPageData?.properties ?? {};
        let bodyData = {
            componentName: "Footer",
            startAndRunCompany: props?.startAndRunCompany ?? null,
            helpPage: props?.helpPage ?? null,
            address1: props?.address1 ?? null,
            address2: props?.address2 ?? null,
            aboutAltinnReference: props?.aboutAltinnReference ?? null,
            operationalMessagesReference: props?.operationalMessagesReference ?? null,
            privacyReference: props?.privacyReference ?? null,
            accessibilityLocation: props?.accessibilityLocation ?? null,
            searchContext: props?.searchContext ?? null,
            searchUrlBody: props?.searchUrlBody ?? null,
            searchPageUrl: props?.searchPageUrl ?? null,
        };

        return bodyData;
    }
}







