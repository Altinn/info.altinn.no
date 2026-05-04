import type { IJSONTransformer } from "../IJSONTransformer";

export class CompareBlockTransformer implements IJSONTransformer {
    public Transform(cmsPageData:any):any {
        /* C# logic (TS-ish++):
        if (block: = null) return null;
        
                    return {
                        heading: block.Heading,
                        compareHeading1: block.CompareHeading1,
                        compareText1: richTextAreaPropsBuilder.Build({
                            richTextArea: block.CompareText1,
                            propertyName: "block.CompareText1"
                        }),
                        compareHeading2: block.CompareHeading2,
                        compareText2: richTextAreaPropsBuilder.Build({
                            richTextArea: block.CompareText2,
                            propertyName: "block.CompareText2"
                        }),
                        compareHeading3: block.CompareHeading3,
                        compareText3: richTextAreaPropsBuilder.Build({
                            richTextArea: block.CompareText3,
                            propertyName: "block.CompareText3"
                        }),
                        compareHeading4: block.CompareHeading4,
                        compareText4: richTextAreaPropsBuilder.Build({
                            richTextArea: block.CompareText4,
                            propertyName: "block.CompareText4"
                        }),
                        ope: withOnPageEdit ? {} : null
                    }
        */
                const props = cmsPageData?.properties ?? {};
        let bodyData = {
            componentName: "CompareBlock",
            heading: props?.heading ?? null,
            compareHeading1: props?.compareHeading1 ?? null,
            compareText1: props?.compareText1 ?? null,
            compareHeading2: props?.compareHeading2 ?? null,
            compareText2: props?.compareText2 ?? null,
            compareHeading3: props?.compareHeading3 ?? null,
            compareText3: props?.compareText3 ?? null,
            compareHeading4: props?.compareHeading4 ?? null,
            compareText4: props?.compareText4 ?? null,
            ope: props?.ope ?? null,
        };

        return bodyData;
    }
}







