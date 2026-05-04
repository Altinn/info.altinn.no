import type { IJSONTransformer } from "../IJSONTransformer";

export class PageSidebarTransformer implements IJSONTransformer {
    public Transform(cmsPageData:any):any {
        /* C# logic (TS-ish++):
        const currentpage: parameters.CurrentPage;
                    const culture: CultureInfo.CurrentCulture.NormalizeCulture();
                    const culturename: culture.Name;
        
                    return currentPage switch
                    {
                        providerPage: > BuildProviderSidebar(culture, cultureName),
                        categoryPage: > BuildCategorySidebar(currentPage, culture, cultureName),
                        subCategoryPage: > BuildSubCategorySidebar(currentPage, culture, cultureName),
                        schemaPage: > BuildSubCategorySidebar(currentPage, culture, cultureName),
                        helpDrilldownPage: > BuildHelpDrilldownSidebar(currentPage, culture, cultureName),
                        helpLandingPage: > BuildHelpLandingSidebar(currentPage, culture, cultureName),
                        _: > null
                    }
        */
                const props = cmsPageData?.properties ?? {};
        let bodyData = {
            componentName: "PageSidebar",
            titleItem: props?.titleItem ?? null,
            mainItems: props?.mainItems ?? null,
        };

        return bodyData;
    }
}







