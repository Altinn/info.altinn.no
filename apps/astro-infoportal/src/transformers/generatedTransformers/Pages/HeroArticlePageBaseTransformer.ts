import type { IJSONTransformer } from "../IJSONTransformer";
import { fetchUmbracoAncestors } from "../../../api/umbraco/client";
import { BreadcrumbsTransformer } from "../../BreadcrumbsTransformer";

export class HeroArticlePageBaseTransformer implements IJSONTransformer {
    public async Transform(cmsPageData:any): Promise<any> {
        /* C# logic (TS-ish++):
        const culture: CultureInfo.CurrentCulture.NormalizeCulture();
                    const pageviewModel: new PageViewModel<HeroArticlePageBase>(currentPage);
                    const lastchanged: currentPage.LastChanged != default ? currentPage.lastChanged: currentPage.Changed;
        
                    return {
                        pageName: currentPage.PageName,
                        mainIntro: currentPage.MainIntro,
                        mainBody: richTextAreaPropsBuilder.Build({ richTextArea: currentPage.MainBody, propertyName: "currentPage.MainBody" }),
                        timeline: currentPage.Timeline != null ? currentPage.Timeline.map(x: > {
                            heading: x.Heading,
                            subHeading: x.SubHeading,
                            content: contentAreaPropsBuilder.Build({ contentArea: x.Content, propertyName: "x.Content" })
                        }) : null,
                        breadcrumb: breadcrumbViewModelBuilder.Build({ currentPage: currentPage }),
                        lastUpdatedDateText: localizationService.GetStringByCulture("/common/lastupdated", culture),
                        lastUpdatedDateString: `{lastchanged:dd.MM.yyyy}`,
                        bottomContentArea: contentAreaPropsBuilder.Build({ contentArea: currentPage.BottomContentArea, propertyName: "currentPage.BottomContentArea" }),
                        commonBottomArea: contentAreaPropsBuilder.Build({ contentArea: currentPage.BottomContentArea, propertyName: "pageViewModel.Layout.CommonBottomArea" }),
                        articlePageHero: articlePageHeroBlockViewModelBuilder.Build({ hero: currentPage.Hero, image: currentPage.Image })
                    }
        */
                const props = cmsPageData?.properties ?? {};
        const ancestors = await fetchUmbracoAncestors(cmsPageData.id);
        const breadcrumb = BreadcrumbsTransformer.Transform(ancestors, cmsPageData);
        let bodyData = {
            componentName: "HeroArticlePageBase",
            pageName: cmsPageData?.name ?? null,
            mainIntro: props?.mainIntro ?? null,
            mainBody: props?.mainBody ?? null,
            timeline: props?.timeline ?? null,
            breadcrumb: breadcrumb,
            lastUpdatedDateText: props?.lastUpdatedDateText ?? null,
            lastUpdatedDateString: props?.lastUpdatedDateString ?? null,
            bottomContentArea: props?.bottomContentArea ?? null,
            commonBottomArea: props?.commonBottomArea ?? null,
            articlePageHero: props?.articlePageHero ?? null,
        };

        return bodyData;
    }
}










