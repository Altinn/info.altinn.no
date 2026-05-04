import type { IJSONTransformer } from "../IJSONTransformer";

export class ContactFormSiteBlockDataTransformer implements IJSONTransformer {
    public Transform(cmsPageData:any):any {
        /* C# logic (TS-ish++):
        return {
                        heading: block.Heading,
                        ope: withOnPageEdit ? {} : null,
                    }
        */
                const props = cmsPageData?.properties ?? {};
        let bodyData = {
            componentName: "ContactFormSiteBlockData",
            heading: props?.heading ?? null,
            ope: props?.ope ?? null,
        };

        return bodyData;
    }
}







