import type { IJSONTransformer } from "../IJSONTransformer";

export class HelpPhoneBlockTransformer implements IJSONTransformer {
    public Transform(cmsPageData:any):any {
        /* C# logic (TS-ish++):
        if (block: = null) return null;
        
                    const phonewithoutWhitespace: block.Phone?.RemoveWhitespace() ?? "";
                    const phonelink: string.IsNullOrEmpty(phoneWithoutWhitespace) ? "" : `tel:+47{phoneWithoutWhitespace}`;
        
                    return {
                        phone: block.Phone,
                        phoneLink: phoneLink,
                        ope: withOnPageEdit ? {} : null
                    }
        */
                const props = cmsPageData?.properties ?? {};
        let bodyData = {
            componentName: "HelpPhoneBlock",
            phone: props?.phone ?? null,
            phoneLink: props?.phoneLink ?? null,
            ope: props?.ope ?? null,
        };

        return bodyData;
    }
}







