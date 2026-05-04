import type { IJSONTransformer } from "../IJSONTransformer";

export class ProviderContactInformationBlockTransformer implements IJSONTransformer {
    public Transform(cmsPageData:any):any {
        /* C# logic (TS-ish++):
        const culture: CultureInfo.CurrentCulture.NormalizeCulture();
                    const ringprefix: localizationService.GetStringByCulture("/provider/ring", culture);
        
                    return {
                        body: richTextAreaPropsBuilder.Build({
                            richTextArea: block.Body,
                            propertyName: "block.Body"
                        }),
                        bottomText: richTextAreaPropsBuilder.Build({
                            richTextArea: block.BottomText,
                            propertyName: "block.BottomText"
                        }),
                        webpageLink: linkItemViewModelBuilder.Build(block.WebpageLink),
                        telephone: block.Telephone ?? "",
                        telephoneLabel: !string.IsNullOrEmpty(block.Telephone)
                            ? `{ringPrefix} {block.Telephone}`
                            : "",
                        email: block.Email ?? "",
                        emailTitle: block.EmailTitle ?? "",
                        ope: withOnPageEdit ? {} : null,
                        fullRefreshProperties: withOnPageEdit
                            ? ["block.Body", "block.BottomText"]
                            : null
                    }
        */
                const props = cmsPageData?.properties ?? {};
        let bodyData = {
            componentName: "ProviderContactInformationBlock",
            body: props?.body ?? null,
            bottomText: props?.bottomText ?? null,
            webpageLink: props?.webpageLink ?? null,
            telephone: props?.telephone ?? null,
            telephoneLabel: props?.telephoneLabel ?? null,
            email: props?.email ?? null,
            emailTitle: props?.emailTitle ?? null,
            ope: props?.ope ?? null,
            fullRefreshProperties: props?.fullRefreshProperties ?? null,
        };

        return bodyData;
    }
}







