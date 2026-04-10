import type { IJSONTransformer } from "../IJSONTransformer";
import { fetchUmbracoAncestors } from "../../../api/umbraco/client";
import { BreadcrumbsTransformer } from "../../BreadcrumbsTransformer";
import type { SubsidyPageViewModel } from "../../../Models/Generated/SubsidyPageViewModel";

export class SubsidyPageTransformer implements IJSONTransformer {
  public async Transform(cmsPageData: any): Promise<SubsidyPageViewModel> {
    /* C# logic (TS-ish++):
    const culture: CultureInfo.CurrentCulture.NormalizeCulture();
                const pageviewModel: new PageViewModel<SubsidyPage>(currentPage);
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
                    agency: currentPage.Agency,
                    coordinator: currentPage.Coordinator,
                    industryConnection: currentPage.IndustryConnection,
                    purposeConnection: currentPage.PurposeConnection
                }
    */
        const ancestors = await fetchUmbracoAncestors(cmsPageData.id);
    const breadcrumb = BreadcrumbsTransformer.Transform(ancestors, cmsPageData);
    return {
      componentName: "SubsidyPage",
      pageName: cmsPageData.name,
      mainIntro: cmsPageData.properties.mainIntro || undefined,
      mainBody: cmsPageData.properties.mainBody || undefined,
      timeline: cmsPageData.properties.timeline || [],
      breadcrumb: breadcrumb,
      lastUpdatedDateText: cmsPageData.properties.lastUpdatedDateText || undefined,
      lastUpdatedDateString: cmsPageData.properties.lastUpdatedDateString || undefined,
      bottomContentArea: cmsPageData.properties.bottomContentArea || undefined,
      commonBottomArea: cmsPageData.properties.commonBottomArea || undefined,
      agency: cmsPageData.properties.agency || undefined,
      coordinator: cmsPageData.properties.coordinator || undefined,
      industryConnection: cmsPageData.properties.industryConnection || undefined,
      purposeConnection: cmsPageData.properties.purposeConnection || undefined,
      ...cmsPageData.properties,
    } as SubsidyPageViewModel;
  }
}













