import type { IJSONTransformer } from "./IJSONTransformer";

export class HelpLandingPageTransformer implements IJSONTransformer {
  public async Transform(cmsPageData: any): Promise<any> {

     /* C# logic (TS-ish++):
    const culture: CultureInfo.CurrentCulture.NormalizeCulture();
    
                const childpageItems: contentLoader.GetChildren<SitePageData>(currentPage.ContentLink)
                    .FilterForDisplay()
                    .filter(item: > isHelpQuestionPage(item) || isHelpProcessArticlePage(item))
                    .map(item: >
                    {
                        if isHelpQuestionPage((item) questionPage)
                        {
                            return {
                                pageName: questionPage.PageName,
                                pageType: "HelpQuestionPage",
                                url: urlResolver.GetUrl(questionPage.ContentLink, culture.Name, { contextMode: ContextMode.Default }),
                                body: richTextAreaPropsBuilder.Build({ richTextArea: questionPage.MainBody })
                            };
                        }
                        else if isHelpProcessArticlePage((item) articlePage)
                        {
                            return {
                                pageName: articlePage.PageName,
                                pageType: "HelpProcessArticlePage",
                                url: urlResolver.GetUrl(articlePage.ContentLink, culture.Name, { contextMode: ContextMode.Default }),
                                body: richTextAreaPropsBuilder.Build({ richTextArea: articlePage.MainBody })
                            };
                        }
                        return null;
                    })
                    .filter(item: > item != null)
                    ;
    
                return {
                    pageName: currentPage.PageName,
                    mainIntro: currentPage.MainIntro,
                    questionHeading: currentPage.QuestionHeading,
                    topicName: currentPage.TopicName,
                    childPages: childPageItems,
                    bottomContentArea: contentAreaPropsBuilder.Build({
                        contentArea: currentPage.BottomContentArea,
                        propertyName: "currentPage.BottomContentArea"
                    }),
                    breadcrumb: breadcrumbViewModelBuilder.Build({ currentPage: currentPage }),
                    ope: withOnPageEdit ? {} : null
                }
    */
   
    return {
      componentName: "HelpLandingPage",
      pageName: cmsPageData.name,
      ...cmsPageData.properties,
      isUserLoggedIn: false,
    };
  }
}
