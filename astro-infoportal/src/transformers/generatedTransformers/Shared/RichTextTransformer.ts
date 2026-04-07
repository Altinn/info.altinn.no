import type { IJSONTransformer } from "../IJSONTransformer";

export class RichTextTransformer implements IJSONTransformer {
    public Transform(cmsPageData:any):any {
        /* C# logic (TS-ish++):
        const parameters: {
                        richTextArea: block.Text,
                        propertyName: "RichTextBlock.Text"
                    };
        
                    return areaBuilder.Build(parameters, withOnPageEdit)
        */
                const props = cmsPageData?.properties ?? {};
        let bodyData = {
            componentName: "RichText",
            richTextArea: props?.richTextArea ?? null,
            propertyName: props?.propertyName ?? null,
        };

        return bodyData;
    }
}







