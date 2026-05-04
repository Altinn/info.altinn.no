import type { IJSONTransformer } from "../IJSONTransformer";

export class IReactTransformer implements IJSONTransformer {
    public Transform(cmsPageData:any):any {
        /* C# logic (TS-ish++): (no Build body found) */
                const props = cmsPageData?.properties ?? {};
        let bodyData = {
            componentName: "IReact",
            placeholder: null,
        };

        return bodyData;
    }
}







