import type { IJSONTransformer } from "../IJSONTransformer";

export class LinkBlockTransformer implements IJSONTransformer {
    public Transform(cmsPageData:any):any {
        /* C# logic (TS-ish++):
        return {
                        fullWidth: block.FullWidth,
                        icon: block.Icon,
                        extraTitle: block.ExtraTitle,
                        link: block.UrlBlock != null ? urlBlockViewModelBuilder.Build(block.UrlBlock, withOnPageEdit) : null,
                        ope: withOnPageEdit ? {} : null
                    }
        */
                const props = cmsPageData?.properties ?? {};
        let bodyData = {
            componentName: "LinkBlock",
            fullWidth: props?.fullWidth ?? null,
            icon: props?.icon ?? null,
            extraTitle: props?.extraTitle ?? null,
            link: props?.link ?? null,
            ope: props?.ope ?? null,
        };

        return bodyData;
    }
}







