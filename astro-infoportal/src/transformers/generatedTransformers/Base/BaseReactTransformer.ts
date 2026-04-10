import type { IJSONTransformer } from "../IJSONTransformer";

export class BaseReactTransformer implements IJSONTransformer {
    public Transform(cmsPageData:any):any {
        /* C# logic (TS-ish++):
        return Build((T)content, withOnPageEdit)
        */
                const props = cmsPageData?.properties ?? {};
        let bodyData = {
            componentName: "BaseReact",
            placeholder: null,
        };

        return bodyData;
    }
}







