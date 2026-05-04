import type { IJSONTransformer } from "../IJSONTransformer";

export class SchemaAccordianBlockTransformer implements IJSONTransformer {
    public Transform(cmsPageData:any):any {
        /* C# logic (TS-ish++):
        const culture: CultureInfo.CurrentCulture.NormalizeCulture();
        
                    return {
                        heading: block.Heading,
                        translatedHeading: localizationService.GetStringByCulture(block.TranslatedHeading, culture),
                        description: richTextAreaPropsBuilder.Build(
                            { 
                                richTextArea: block.Description, 
                                propertyName: "block.Description" 
                            })
                    }
        */
                const props = cmsPageData?.properties ?? {};
        let bodyData = {
            componentName: "SchemaAccordianBlock",
            heading: props?.heading ?? null,
            translatedHeading: props?.translatedHeading ?? null,
            description: props?.description ?? null,
        };

        return bodyData;
    }
}







