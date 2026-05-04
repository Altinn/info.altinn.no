import type { IJSONTransformer } from "../IJSONTransformer";

export class VectorImageBlockTransformer implements IJSONTransformer {
    public Transform(cmsPageData:any):any {
        /* C# logic (TS-ish++):
        const viewmodel: {
                        vectorImage: _imagePropsBuilder.Build(block.VectorImage, withOnPageEdit),
                        altText: block.AltText,
                        caption: block.Caption,
                        backgroundColor: block.BackgroundColor,
                        ope: withOnPageEdit ? {} : null
                    };
        
                    return viewModel
        */
                const props = cmsPageData?.properties ?? {};
        let bodyData = {
            componentName: "VectorImageBlock",
            vectorImage: props?.vectorImage ?? null,
            altText: props?.altText ?? null,
            caption: props?.caption ?? null,
            backgroundColor: props?.backgroundColor ?? null,
            ope: props?.ope ?? null,
        };

        return bodyData;
    }
}







