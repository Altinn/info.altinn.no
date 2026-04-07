import type { IJSONTransformer } from "../IJSONTransformer";

export class GenericBlockPropsTransformer implements IJSONTransformer {
    public Transform(cmsPageData:any):any {
        /* C# logic (TS-ish++):
        const propsbuilderType: typeof(IReactPropsBuilder<>).MakeGenericType(type);
                const propsbuilder: services.GetRequiredService(propsBuilderType) as IReactPropsBuilder;
        
                return propsBuilder.Build(block, withOnPageEdit)
        */
                const props = cmsPageData?.properties ?? {};
        let bodyData = {
            componentName: "GenericBlockProps",
            placeholder: null,
        };

        return bodyData;
    }
}







