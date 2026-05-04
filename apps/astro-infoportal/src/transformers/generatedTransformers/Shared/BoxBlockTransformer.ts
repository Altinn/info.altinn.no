import type { IJSONTransformer } from "../IJSONTransformer";

export class BoxBlockTransformer implements IJSONTransformer {
    public Transform(cmsPageData:any):any {
        /* C# logic (TS-ish++):
        return {
                        title: block.Title,
                        description: block.Description,
                        color: block.Color?.ToLowerInvariant() ?? "blue",
                        type: "link",
                        link: linkItemViewModelBuilder.Build(block.Link, withOnPageEdit)
                    }
        */
                const props = cmsPageData?.properties ?? {};
        let bodyData = {
            componentName: "BoxBlock",
            title: props?.title ?? null,
            description: props?.description ?? null,
            color: props?.color ?? null,
            type: props?.type ?? null,
            link: props?.link ?? null,
        };

        return bodyData;
    }
}







