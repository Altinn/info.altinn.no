import type { IJSONTransformer } from "../IJSONTransformer";

export class HelpSearchPageTransformer implements IJSONTransformer {
    public Transform(cmsPageData:any):any {
        /* C# logic (TS-ish++):
        const httpcontext: httpContextAccessor.HttpContext;
                    const query: httpContext?.Request.Query["q"].ToString();
                    const culture: CultureInfo.CurrentCulture.NormalizeCulture();
                    const validatedquery: InputValidationHelper.ValidateSearchTermInput(query);
        
                    const results: [];
                    long totalhits: 0;
        
                    if (!string.IsNullOrEmpty(validatedQuery))
                    {
                        const searchresult: helpContentSearchService.Search(
                            currentPage.Language.Name,
                            validatedQuery,
                            skip: 0,
                            take: 1000,
                            excludefromStatistics: true)
                            .GetAwaiter()
                            .GetResult();
        
                        totalhits: searchResult.Item2;
        
                        results: searchResult.Item1
                            .filter(page: > isHelpQuestionPage(page) || isHelpProcessArticlePage(page))
                            .map(page: >
                            {
                                if isHelpQuestionPage((page) questionPage)
                                {
                                    return {
                                        pageName: questionPage.PageName,
                                        pageType: "HelpQuestionPage",
                                        url: urlResolver.GetUrl(questionPage.ContentLink, culture.Name, { contextMode: ContextMode.Default }),
                                        body: richTextAreaPropsBuilder.Build({ richTextArea: questionPage.MainBody })
                                    };
                                }
                                else if isHelpProcessArticlePage((page) articlePage)
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
                    }
        
                    const startpage: contentLoader.Get<StartPage>(ContentReference.StartPage);
                    const searchpageUrl: startPage.SearchPage != null
                        ? urlResolver.GetUrl(startPage.SearchPage, culture.Name, { contextMode: ContextMode.Default })
                        : "";
        
                    const helpsearchPageUrl: urlResolver.GetUrl(currentPage.ContentLink, culture.Name, { contextMode: ContextMode.Default });
        
                    return {
                        pageName: currentPage.PageName,
                        query: validatedQuery,
                        totalHits: totalHits,
                        results: results,
                        searchHitsText: localizationService.GetStringByCulture("/search/hits", culture),
                        searchForText: localizationService.GetStringByCulture("/search/for", culture),
                        advertisementIntroText: localizationService.GetStringByCulture("/search/advertisements/helpsection/intro", culture),
                        clickHereText: localizationService.GetStringByCulture("/common/clickhere", culture),
                        toSearchForText: localizationService.GetStringByCulture("/search/advertisements/tosearchfor", culture),
                        inText: localizationService.GetStringByCulture("/common/in", culture),
                        otherContentText: localizationService.GetStringByCulture("/search/advertisements/helpsection/othercontent", culture),
                        searchPageUrl: searchPageUrl,
                        helpSearchPageUrl: helpSearchPageUrl,
                        searchPlaceholder: localizationService.GetStringByCulture("/search/searchinhelp", culture),
                        breadcrumb: breadcrumbViewModelBuilder.Build({ currentPage: currentPage }),
                        ope: withOnPageEdit ? {} : null
                    }
        */
                const props = cmsPageData?.properties ?? {};
        let bodyData = {
            componentName: "HelpSearchPage",
            pageName: cmsPageData?.name ?? null,
            pageType: props?.pageType ?? null,
            url: props?.url ?? null,
            body: props?.body ?? null,
        };

        return bodyData;
    }
}









