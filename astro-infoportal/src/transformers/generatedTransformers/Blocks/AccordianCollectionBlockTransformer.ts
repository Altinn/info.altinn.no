import type { IJSONTransformer } from "../IJSONTransformer";

export class AccordianCollectionBlockTransformer implements IJSONTransformer {
    public Transform(cmsPageData:any):any {
        /* C# logic (TS-ish++):
        return {
                        accordianArea: contentAreaPropsBuilder.Build(
                            {
                                contentArea: block.AccordianArea,
                                propertyName: "AccordianCollectionBlock.AccordianArea"
                            },
                            withOnPageEdit
                        ),
                        ope: withOnPageEdit ? {} : null
                    }
        */
                const props = cmsPageData?.properties ?? {};
        let bodyData = {
            componentName: "AccordianCollectionBlock",
            accordianArea: props?.accordianArea ?? null,
            ope: props?.ope ?? null,
        };

        return bodyData;
    }
}







