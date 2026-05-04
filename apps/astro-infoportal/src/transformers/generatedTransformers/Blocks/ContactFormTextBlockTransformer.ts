import type { IJSONTransformer } from "../IJSONTransformer";

export class ContactFormTextBlockTransformer implements IJSONTransformer {
    public Transform(cmsPageData:any):any {
        /* C# logic (TS-ish++):
        if (block: = null) return null;
        
                    return {
                        heading: block.Heading,
                        contactHeading: block.ContactHeading,
                        teaserText: richTextAreaPropsBuilder.Build({
                            richTextArea: block.TeaserText,
                            propertyName: "block.TeaserText"
                        }),
                        ope: withOnPageEdit ? {} : null
                    }
        */
                const props = cmsPageData?.properties ?? {};
        let bodyData = {
            componentName: "ContactFormTextBlock",
            heading: props?.heading ?? null,
            contactHeading: props?.contactHeading ?? null,
            teaserText: props?.teaserText ?? null,
            ope: props?.ope ?? null,
        };

        return bodyData;
    }
}







