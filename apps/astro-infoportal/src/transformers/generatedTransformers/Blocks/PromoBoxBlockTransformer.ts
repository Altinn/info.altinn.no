import type { IJSONTransformer } from "../IJSONTransformer";

export class PromoBoxBlockTransformer implements IJSONTransformer {
    public Transform(cmsPageData:any):any {
        /* C# logic (TS-ish++):
        return {
                        image: imagePropsBuilder.Build(block.Image),
                        imageAltText: block.ImageAltText,
                        link: block.Link != null ? linkItemViewModelBuilder.Build(block.Link) : null,
                        text: richTextAreaPropsBuilder.Build({       
                            richTextArea: block.Text,
                            propertyName: "block.Text"
                        }),
                        ope: withOnPageEdit ? {} : null,
                        fullRefreshProperties: withOnPageEdit ? ["block.Text"] : null
                    }
        */
                const props = cmsPageData?.properties ?? {};
        let bodyData = {
            componentName: "PromoBoxBlock",
            image: props?.image ?? null,
            imageAltText: props?.imageAltText ?? null,
            link: props?.link ?? null,
            text: props?.text ?? null,
            ope: props?.ope ?? null,
            fullRefreshProperties: props?.fullRefreshProperties ?? null,
        };

        return bodyData;
    }
}







