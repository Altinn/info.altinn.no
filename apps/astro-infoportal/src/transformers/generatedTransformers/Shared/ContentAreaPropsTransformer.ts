import type { IJSONTransformer } from "../IJSONTransformer";

export class ContentAreaPropsTransformer implements IJSONTransformer {
    public Transform(cmsPageData:any):any {
        /* C# logic (TS-ish++):
        _currentparameters: parameters;
        
                const items: isnull(parameters.ContentArea) ?
                    [] :
                    parameters.ContentArea.Items.map(BuildPropsForContentAreaItem)
                        .filter(x: > x != null)
                        ;
        
                _currentparameters: null;
        
                return {
                    items: items,
                    ope: withOnPageEdit ? new() { { "parameters.ContentArea", parameters.PropertyName } } : null,
                }
        */
                const props = cmsPageData?.properties ?? {};
        let bodyData = {
            componentName: "ContentAreaProps",
            items: props?.items ?? null,
            ope: props?.ope ?? null,
        };

        return bodyData;
    }
}







