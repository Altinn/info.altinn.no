import type { IJSONTransformer } from "../IJSONTransformer";

export class AccordionBlockViewModelTransformer implements IJSONTransformer {
    public Transform(cmsPageData:any):any {
        /* C# logic (TS-ish++):
        const culture: CultureInfo.CurrentCulture.NormalizeCulture();
        
                    return {
                        heading: block.Heading,
                        description: richTextAreaPropsBuilder.Build(
                            {
                                richTextArea: block.Description,
                                propertyName: "block.Description"
                            })
                    }
        */
                const props = cmsPageData?.properties ?? {};
        let bodyData = {
            componentName: "AccordionBlockViewModel",
            heading: props?.heading ?? null,
            description: props?.description ?? null,
        };

        return bodyData;
    }
}







