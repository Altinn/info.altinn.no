import type { IJSONTransformer } from "../IJSONTransformer";

export class ContactBlockTransformer implements IJSONTransformer {
    public Transform(cmsPageData:any):any {
        /* C# logic (TS-ish++):
        return {
                        header: block.Header,
                        text: block.Text,
                        phoneNumber: block.PhoneNumber,
                        ope: withOnPageEdit ? {} : null
                    }
        */
                const props = cmsPageData?.properties ?? {};
        let bodyData = {
            componentName: "ContactBlock",
            header: props?.header ?? null,
            text: props?.text ?? null,
            phoneNumber: props?.phoneNumber ?? null,
            ope: props?.ope ?? null,
        };

        return bodyData;
    }
}







