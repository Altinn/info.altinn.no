import type { IJSONTransformer } from "../IJSONTransformer";

export class LinkButtonBlockTransformer implements IJSONTransformer {
    public Transform(cmsPageData:any):any {
        /* C# logic (TS-ish++):
        return {
                        link: linkItemViewModelBuilder.Build(block.Link, withOnPageEdit),
                        icon: block.Icon,
                        buttonType: block.ButtonType
                    }
        */
                const props = cmsPageData?.properties ?? {};
        let bodyData = {
            componentName: "LinkButtonBlock",
            link: props?.link ?? null,
            icon: props?.icon ?? null,
            buttonType: props?.buttonType ?? null,
        };

        return bodyData;
    }
}







