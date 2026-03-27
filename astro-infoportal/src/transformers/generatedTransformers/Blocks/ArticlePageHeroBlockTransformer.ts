import type { IJSONTransformer } from "../IJSONTransformer";

export class ArticlePageHeroBlockTransformer implements IJSONTransformer {
    public Transform(cmsPageData:any):any {
        /* C# logic (TS-ish++):
        return {
                        hero: parameters.Hero,
                        image: imagePropsBuilder.Build(parameters.Image),
                        imageUrl: parameters?.Image?.GetFriendlyUrl()?.Replace("\"", "") is string url ? url + "')" : null
                    }
        */
                const props = cmsPageData?.properties ?? {};
        let bodyData = {
            componentName: "ArticlePageHeroBlock",
            hero: props?.hero ?? null,
            image: props?.image ?? null,
            imageUrl: props?.imageUrl ?? null,
        };

        return bodyData;
    }
}







