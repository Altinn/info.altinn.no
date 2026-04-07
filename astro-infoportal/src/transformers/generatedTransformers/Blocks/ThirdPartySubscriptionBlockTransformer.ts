import type { IJSONTransformer } from "../IJSONTransformer";

export class ThirdPartySubscriptionBlockTransformer implements IJSONTransformer {
    public Transform(cmsPageData:any):any {
        /* C# logic (TS-ish++):
        return {
                        buttonText: block.ButtonText,
                        buttonUrl: block.ButtonUrl?.ToString(),
                        ope: withOnPageEdit ? {} : null
                    }
        */
                const props = cmsPageData?.properties ?? {};
        let bodyData = {
            componentName: "ThirdPartySubscriptionBlock",
            buttonText: props?.buttonText ?? null,
            buttonUrl: props?.buttonUrl ?? null,
            ope: props?.ope ?? null,
        };

        return bodyData;
    }
}







