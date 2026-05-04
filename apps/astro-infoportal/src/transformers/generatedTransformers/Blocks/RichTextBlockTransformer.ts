import type { IJSONTransformer } from "../IJSONTransformer";

export class RichTextBlockTransformer implements IJSONTransformer {
    public Transform(cmsPageData:any):any {
        /* C# logic (TS-ish++):
        return {
                        text: richTextAreaPropsBuilder.Build({
                            richTextArea: block.Text,
                            propertyName: "block.Text"
                        })
                    }
        */
                const props = cmsPageData?.properties ?? {};
        let bodyData = {
            componentName: "RichTextBlock",
            text: props?.text ?? null,
        };

        return bodyData;
    }
}







