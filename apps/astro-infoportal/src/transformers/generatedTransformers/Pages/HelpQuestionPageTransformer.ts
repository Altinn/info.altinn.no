import type { IJSONTransformer } from "../IJSONTransformer";
import { fetchUmbracoAncestors } from "../../../api/umbraco/client";
import { BreadcrumbsTransformer } from "../../BreadcrumbsTransformer";

export class HelpQuestionPageTransformer implements IJSONTransformer {
    public async Transform(cmsPageData:any): Promise<any> {
        /* C# logic (TS-ish++):
        return {
                        pageName: currentPage.PageName,
                        hideFromQuickHelp: currentPage.HideFromQuickHelp,
                        mainBody: richTextAreaPropsBuilder.Build({
                            richTextArea: currentPage.MainBody,
                            propertyName: "currentPage.MainBody"
                        }),
                        breadcrumb: breadcrumbViewModelBuilder.Build({ currentPage: currentPage }),
                        ope: withOnPageEdit ? {} : null
                    }
        */
                const props = cmsPageData?.properties ?? {};
        const ancestors = await fetchUmbracoAncestors(cmsPageData.id);
        const breadcrumb = BreadcrumbsTransformer.Transform(ancestors, cmsPageData);
        let bodyData = {
            componentName: "HelpQuestionPage",
            pageName: cmsPageData?.name ?? null,
            hideFromQuickHelp: props?.hideFromQuickHelp ?? null,
            mainBody: props?.mainBody ?? null,
            breadcrumb: breadcrumb,
            ope: props?.ope ?? null,
        };

        return bodyData;
    }
}










