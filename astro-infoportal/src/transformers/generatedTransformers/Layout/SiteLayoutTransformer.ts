import type { IJSONTransformer } from "../IJSONTransformer";

export class SiteLayoutTransformer implements IJSONTransformer {
    public Transform(cmsPageData:any):any {
        /* C# logic (TS-ish++):
        return {
                    headerViewModel: parameters.HeaderParameters != null ? headerViewModelBuilder.Build(parameters.HeaderParameters) : null,
                    footerViewModel: parameters.FooterParameters != null ? footerViewModelBuilder.Build(parameters.FooterParameters) : null,
                    pageSidebarViewModel: parameters.SidebarParameters != null ? pageSidebarViewModelBuilder.Build(parameters.SidebarParameters) : null,
                    child: parameters.Component,
                    skipLinkText: parameters.SkipLinkText
                }
        */
                const props = cmsPageData?.properties ?? {};
        let bodyData = {
            componentName: "SiteLayout",
            headerViewModel: props?.headerViewModel ?? null,
            footerViewModel: props?.footerViewModel ?? null,
            pageSidebarViewModel: props?.pageSidebarViewModel ?? null,
            child: props?.child ?? null,
            skipLinkText: props?.skipLinkText ?? null,
        };

        return bodyData;
    }
}







