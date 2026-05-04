import type { IJSONTransformer } from "../IJSONTransformer";

export class QuoteWithImageBlockTransformer implements IJSONTransformer {
    public Transform(cmsPageData:any):any {
        /* C# logic (TS-ish++):
        if (block: = null) return null;
        
                    return {
                        quote: block.Quote,
                        author: block.Author,
                        image: imagePropsBuilder.Build(block.Image, withOnPageEdit),
                        imageAltText: block.ImageAltText,
                        ope: withOnPageEdit ? {} : null
                    }
        */
                const props = cmsPageData?.properties ?? {};
        let bodyData = {
            componentName: "QuoteWithImageBlock",
            quote: props?.quote ?? null,
            author: props?.author ?? null,
            image: props?.image ?? null,
            imageAltText: props?.imageAltText ?? null,
            ope: props?.ope ?? null,
        };

        return bodyData;
    }
}







