import type { IJSONTransformer } from "./IJSONTransformer";

export class AboutPageTransformer implements IJSONTransformer {
  public async Transform(cmsPageData: any): Promise<any> {

    /* C# logic (TS-ish++):
    const culture: CultureInfo.CurrentCulture.NormalizeCulture();
    
                const linkitems: currentPage.LinkArea?.Items?
                    .map(item: > item.LoadContent())
                    .OfType<SitePageData>()
                    .map(page: >
                    {
                        const url: urlResolver.GetUrl(page.ContentLink, culture.Name, { contextMode: ContextMode.Default });
    
                        string preamble: null;
                        if isHeroArticlePageBase((page) heroArticlePage)
                            preamble: heroArticlePage.MainIntro;
    
                        return {
                            text: page.Name,
                            url: url,
                            preamble: preamble,
                            
                        };
                    })
                     ?? new();
    
                return {
                    pageName: currentPage.PageName,
                    linkArea: linkItems,
                    contactArea: contentAreaPropsBuilder.Build({
                        contentArea: currentPage.ContactArea,
                        propertyName: "currentPage.ContactArea"
                    }, withOnPageEdit),
                    ope: withOnPageEdit ? {} : null
                }
    */

    return {
      componentName: "AboutPage",
      pageName: cmsPageData.name,
      ...cmsPageData.properties,
      isUserLoggedIn: false,
    };
  }
}
