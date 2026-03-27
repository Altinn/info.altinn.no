import type { IJSONTransformer } from "../IJSONTransformer";

export class LatestNewsBlockV2Transformer implements IJSONTransformer {
    public Transform(cmsPageData:any):any {
        /* C# logic (TS-ish++):
        const culture: CultureInfo.CurrentCulture.NormalizeCulture();
        
                    const news: contentLoader
                        .GetChildren<NewsArticlePage>(block.NewsLocation, culture)
                        .FilterForDisplay()
                        .OrderByDescending(n: > n.StartPublish)
                        .Take(block.DisplayLimit)
                        .map(article: > newsArticleItemViewModelBuilder.Build(article))
                        ;
        
                    const heading: localizationService.GetStringByCulture("/news/latestnews", culture);
                    const archivelink: linkItemViewModelBuilder.Build(
                        localizationService.GetStringByCulture("/news/showarchive", culture),
                        block.NewsLocation,
                        culture);
        
                    return {
                        heading: heading,
                        news: news,
                        archiveLink: archiveLink,
                        ope: withOnPageEdit ? {} : null
                    }
        */
                const props = cmsPageData?.properties ?? {};
        let bodyData = {
            componentName: "LatestNewsBlockV2",
            heading: props?.heading ?? null,
            news: props?.news ?? null,
            archiveLink: props?.archiveLink ?? null,
            ope: props?.ope ?? null,
        };

        return bodyData;
    }
}







