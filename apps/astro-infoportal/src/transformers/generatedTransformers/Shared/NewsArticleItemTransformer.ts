import type { IJSONTransformer } from "../IJSONTransformer";

export class NewsArticleItemTransformer implements IJSONTransformer {
    public Transform(cmsPageData:any):any {
        /* C# logic (TS-ish++):
        const culture: CultureInfo.CurrentCulture.NormalizeCulture();
                    
                    return {
                        pageName: newsArticle.PageName,
                        mainIntro: newsArticle.MainIntro,
                        url: urlResolver.GetUrl(newsArticle.ContentLink, culture.Name, { contextMode: ContextMode.Default }),
                        language: newsArticle.Language?.Name
                    }
        */
                const props = cmsPageData?.properties ?? {};
        let bodyData = {
            componentName: "NewsArticleItem",
            pageName: cmsPageData?.name ?? null,
            mainIntro: props?.mainIntro ?? null,
            url: props?.url ?? null,
            language: props?.language ?? null,
        };

        return bodyData;
    }
}







