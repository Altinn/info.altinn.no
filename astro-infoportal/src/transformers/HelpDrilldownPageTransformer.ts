import type { IJSONTransformer } from "./IJSONTransformer";

export class HelpDrilldownPageTransformer implements IJSONTransformer {
  public async Transform(cmsPageData: any): Promise<any> {
        /* C# logic (TS-ish++):
    const culture: CultureInfo.CurrentCulture.NormalizeCulture();
    
                const landingpages: contentLoader.GetChildren<HelpLandingPage>(currentPage.ContentLink)
                    .FilterForDisplay()
                    
                    .map(item: > {
                        pageName: item.PageName,
                        mainIntro: item.MainIntro,
                        url: urlResolver.GetUrl(item.ContentLink, culture.Name, { contextMode: ContextMode.Default })
                    });
    
                return {
                    pageName: currentPage.PageName,
                    triggerWords: currentPage.TriggerWords,
                    iconUrl: currentPage.Icon != null ? urlResolver.GetUrl(currentPage.Icon) : null,
                    altImage: currentPage.AltImage,
                    landingPages: landingPages,
                    bottomContentArea: contentAreaPropsBuilder.Build({
                        contentArea: currentPage.BottomContentArea,
                        propertyName: "currentPage.BottomContentArea"
                    }),
                    breadcrumb: breadcrumbViewModelBuilder.Build({ currentPage: currentPage }),
                    ope: withOnPageEdit ? {} : null
                }
    */
    return {
      componentName: "HelpDrilldownPage",
      pageName: cmsPageData.name,
      ...cmsPageData.properties,
      isUserLoggedIn: false,
    };
  }
}
