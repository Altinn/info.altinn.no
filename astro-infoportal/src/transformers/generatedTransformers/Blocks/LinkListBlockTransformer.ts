import type { IJSONTransformer } from "../IJSONTransformer";

export class LinkListBlockTransformer implements IJSONTransformer {
    public Transform(cmsPageData:any):any {
        /* C# logic (TS-ish++):
        if (block: = null) return null;
        
                    return {
                        linkArea: contentAreaPropsBuilder.Build({
                            contentArea: block.LinkArea,
                            propertyName: "block.LinkArea"
                        }),
                        ope: withOnPageEdit ? {} : null
                    }
        */
                const props = cmsPageData?.properties ?? {};
        let bodyData = {
            componentName: "LinkListBlock",
            linkArea: props?.linkArea ?? null,
            ope: props?.ope ?? null,
        };

        return bodyData;
    }
}







