import type { IJSONTransformer } from "../IJSONTransformer";

export class HelpContactBlockTransformer implements IJSONTransformer {
    public Transform(cmsPageData:any):any {
        /* C# logic (TS-ish++):
        if (block: = null) return null;
        
                    const culture: CultureInfo.CurrentCulture.NormalizeCulture();
                    const contactformUrl: block.ContactFormLocation != null
                        ? urlResolver.GetUrl(block.ContactFormLocation)
                        : "";
        
                    return {
                        contactFormUrl: contactFormUrl,
                        writeToUsText: localizationService.GetStringByCulture("/help/writetous", culture),
                        ope: withOnPageEdit ? {} : null
                    }
        */
                const props = cmsPageData?.properties ?? {};
        let bodyData = {
            componentName: "HelpContactBlock",
            contactFormUrl: props?.contactFormUrl ?? null,
            writeToUsText: props?.writeToUsText ?? null,
            ope: props?.ope ?? null,
        };

        return bodyData;
    }
}







