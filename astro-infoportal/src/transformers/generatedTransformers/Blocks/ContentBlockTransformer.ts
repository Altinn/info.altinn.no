import type { IJSONTransformer } from "../IJSONTransformer";

export class ContentBlockTransformer implements IJSONTransformer {
    public Transform(cmsPageData:any):any {
        /* C# logic (TS-ish++):
        return {
                        content: richTextAreaPropsBuilder.Build({
                            richTextArea: block.Content,
                            propertyName: "block.Content"
                        }),
                        ope: withOnPageEdit ? {} : null
                    }
        */
                const props = cmsPageData?.properties ?? {};
        let bodyData = {
            componentName: "ContentBlock",
            content: props?.content ?? null,
            ope: props?.ope ?? null,
        };

        return bodyData;
    }
}







