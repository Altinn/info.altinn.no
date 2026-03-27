import type { IJSONTransformer } from "../IJSONTransformer";

export class UrlBlockTransformer implements IJSONTransformer {
    public Transform(cmsPageData:any):any {
        /* C# logic (TS-ish++):
        return {
                        linkText: block.LinkText,
                        url: block.Url?.ToString(),
                        openInNewWindow: block.OpenInNewWindow,
                        ope: withOnPageEdit ? {} : null
                    }
        */
                const props = cmsPageData?.properties ?? {};
        let bodyData = {
            componentName: "UrlBlock",
            linkText: props?.linkText ?? null,
            url: props?.url ?? null,
            openInNewWindow: props?.openInNewWindow ?? null,
            ope: props?.ope ?? null,
        };

        return bodyData;
    }
}







