import type { IJSONTransformer } from "../IJSONTransformer";
import { fetchUmbracoAncestors } from "../../../api/umbraco/client";
import { BreadcrumbsTransformer } from "../../BreadcrumbsTransformer";

export class HelpProcessArticlePageTransformer implements IJSONTransformer {
    public async Transform(cmsPageData:any): Promise<any> {
        /* C# logic (TS-ish++):
        const culture: CultureInfo.CurrentCulture.NormalizeCulture();
                    const lastupdatedDateText: localizationService.GetStringByCulture("/common/lastupdated", culture);
        
                    return {
                        pageName: currentPage.PageName,
                        hideFromQuickHelp: currentPage.HideFromQuickHelp,
                        mainIntro: currentPage.MainIntro,
                        mainBody: richTextAreaPropsBuilder.Build({
                            richTextArea: currentPage.MainBody,
                            propertyName: "currentPage.MainBody"
                        }),
                        timeline: currentPage.Timeline?.map(x: > {
                            heading: x.Heading,
                            subHeading: x.SubHeading,
                            content: contentAreaPropsBuilder.Build({ contentArea: x.Content })
                        }),
                        bottomContentArea: contentAreaPropsBuilder.Build({
                            contentArea: currentPage.BottomContentArea,
                            propertyName: "currentPage.BottomContentArea"
                        }),
                        linkToPortalProcess: currentPage.LinkToPortalProcess?.ToString(),
                        lastUpdatedDateText: lastUpdatedDateText,
                        lastUpdatedDateString: currentPage.LastChanged != default
                            ? currentPage.LastChanged.ToString("dd.MM.yyyy", culture)
                            : "",
                        breadcrumb: breadcrumbViewModelBuilder.Build({ currentPage: currentPage }),
                        ope: withOnPageEdit ? {} : null,
                        fullRefreshProperties: withOnPageEdit ? ["currentPage.MainBody"] : null
                    }
        */
                const props = cmsPageData?.properties ?? {};
        const ancestors = await fetchUmbracoAncestors(cmsPageData.id);
        const breadcrumb = BreadcrumbsTransformer.Transform(ancestors, cmsPageData);
        let bodyData = {
            componentName: "HelpProcessArticlePage",
            pageName: cmsPageData?.name ?? null,
            hideFromQuickHelp: props?.hideFromQuickHelp ?? null,
            mainIntro: props?.mainIntro ?? null,
            mainBody: props?.mainBody ?? null,
            timeline: props?.timeline ?? null,
            bottomContentArea: props?.bottomContentArea ?? null,
            linkToPortalProcess: props?.linkToPortalProcess ?? null,
            lastUpdatedDateText: props?.lastUpdatedDateText ?? null,
            lastUpdatedDateString: props?.lastUpdatedDateString ?? null,
            breadcrumb: breadcrumb,
            ope: props?.ope ?? null,
            fullRefreshProperties: props?.fullRefreshProperties ?? null,
        };

        return bodyData;
    }
}










