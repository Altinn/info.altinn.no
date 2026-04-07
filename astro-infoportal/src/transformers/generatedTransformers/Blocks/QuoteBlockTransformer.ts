import type { IJSONTransformer } from "../IJSONTransformer";

export class QuoteBlockTransformer implements IJSONTransformer {
    public Transform(cmsPageData:any):any {
        /* C# logic (TS-ish++):
        if (block: = null) return null;
        
                    return {
                        quote: block.Quote,
                        author: block.Author,
                        ope: withOnPageEdit ? {} : null
                    }
        */
                const props = cmsPageData?.properties ?? {};
        let bodyData = {
            componentName: "QuoteBlock",
            quote: props?.quote ?? null,
            author: props?.author ?? null,
            ope: props?.ope ?? null,
        };

        return bodyData;
    }
}







