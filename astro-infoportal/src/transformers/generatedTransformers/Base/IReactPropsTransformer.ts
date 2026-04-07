import type { IJSONTransformer } from "../IJSONTransformer";

export class IReactPropsTransformer implements IJSONTransformer {
    public Transform(cmsPageData:any):any {
        /* C# logic (TS-ish++):
        IReactComponentProps Build(T content, bool withonPageEdit: false)
        */
                const props = cmsPageData?.properties ?? {};
        let bodyData = {
            componentName: "IReactProps",
            placeholder: null,
        };

        return bodyData;
    }
}







