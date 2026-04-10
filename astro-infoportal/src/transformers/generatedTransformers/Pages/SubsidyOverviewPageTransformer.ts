import type { IJSONTransformer } from "../IJSONTransformer";
import { fetchUmbracoAncestors } from "../../../api/umbraco/client";
import { BreadcrumbsTransformer } from "../../BreadcrumbsTransformer";
import type { SubsidyOverviewPageViewModel } from "../../../Models/Generated/SubsidyOverviewPageViewModel";

export class SubsidyOverviewPageTransformer implements IJSONTransformer {
  public async Transform(cmsPageData: any): Promise<SubsidyOverviewPageViewModel> {
    /* C# logic (TS-ish++):
    const culture: CultureInfo.CurrentCulture.NormalizeCulture();
    
                return {
                    pageName: currentPage.PageName,
                    mainIntro: currentPage.MainIntro,
                    maxItems: currentPage.MaxItems,
                    subsidyApiUrl: `/inforportalapi/getsubsidy/{culture.Name}`,
                    breadcrumb: breadcrumbViewModelBuilder.Build({ currentPage: currentPage }),
                    translations: {
                        purposeHeader: localizationService.GetStringByCulture("/subsidy/purposeheader", culture),
                        purpose: localizationService.GetStringByCulture("/subsidy/purpose", culture),
                        purposePlural: localizationService.GetStringByCulture("/subsidy/purposeplural", culture),
                        industrySingle: localizationService.GetStringByCulture("/subsidy/industrysingle", culture),
                        industryMultiple: localizationService.GetStringByCulture("/subsidy/industrymultiple", culture),
                        youHaveChosen: localizationService.GetStringByCulture("/subsidy/youhavechosen", culture),
                        choose: localizationService.GetStringByCulture("/subsidy/choose", culture),
                        showMeSubsidy: localizationService.GetStringByCulture("/subsidy/showmesubsidy", culture),
                        noHits: localizationService.GetStringByCulture("/subsidy/nohits", culture),
                        industryIndependent: localizationService.GetStringByCulture("/subsidy/industryindependent", culture),
                        industryIndependentWillShow: localizationService.GetStringByCulture("/subsidy/industryindependentwillshow", culture),
                        loadMore: localizationService.GetStringByCulture("/subsidy/loadmore", culture)
                    },
                    ope: withOnPageEdit ? {} : null
                }
    */
        const ancestors = await fetchUmbracoAncestors(cmsPageData.id);
    const breadcrumb = BreadcrumbsTransformer.Transform(ancestors, cmsPageData);
    return {
      componentName: "SubsidyOverviewPage",
      pageName: cmsPageData.name,
      mainIntro: cmsPageData.properties.mainIntro || undefined,
      maxItems: cmsPageData.properties.maxItems || 0,
      subsidyApiUrl: cmsPageData.properties.subsidyApiUrl || undefined,
      breadcrumb: breadcrumb,
      translations: cmsPageData.properties.translations || undefined,
      ...cmsPageData.properties,
    } as SubsidyOverviewPageViewModel;
  }
}













