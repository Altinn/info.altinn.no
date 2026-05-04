import type { IJSONTransformer } from "../IJSONTransformer";

export class HelpBlockTransformer implements IJSONTransformer {
    public Transform(cmsPageData:any):any {
        /* C# logic (TS-ish++):
        if (block: = null) return null;
        
                    return {
                        description: richTextAreaPropsBuilder.Build({
                            richTextArea: block.Description,
                            propertyName: "block.Description"
                        }),
                        ope: withOnPageEdit ? {} : null
                    }
        */
                const props = cmsPageData?.properties ?? {};
        let bodyData = {
            componentName: "HelpBlock",
            description: props?.description ?? null,
            ope: props?.ope ?? null,
        };

        return bodyData;
    }
}







