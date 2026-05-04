import type { IJSONTransformer } from "../IJSONTransformer";

export class CampaignBlockTransformer implements IJSONTransformer {
    public Transform(cmsPageData:any):any {
        /* C# logic (TS-ish++):
        if (block: = null) return null;
        
                    return {
                        link: linkItemViewModelBuilder.Build(block.Link),
                        description: richTextAreaPropsBuilder.Build({
                            richTextArea: block.Description,
                            propertyName: "block.Description"
                        }),
                        ope: withOnPageEdit ? {} : null
                    }
        */
                const props = cmsPageData?.properties ?? {};
        let bodyData = {
            componentName: "CampaignBlock",
            link: props?.link ?? null,
            description: props?.description ?? null,
            ope: props?.ope ?? null,
        };

        return bodyData;
    }
}







