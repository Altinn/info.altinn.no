import type { IJSONTransformer } from "../IJSONTransformer";

export class AdvisorStartBlockTransformer implements IJSONTransformer {
    public Transform(cmsPageData:any):any {
        /* C# logic (TS-ish++):
        const culture: CultureInfo.CurrentCulture.NormalizeCulture();
        
                    // Resolve button text with localization fallback
                    const buttontext: string.IsNullOrWhiteSpace(block.ButtonText)
                        ? localizationService.GetStringByCulture("/startadvisor", culture)
                        : block.ButtonText;
        
                    // Build link from EPi Url
                    LinkItemViewModel link: null;
                    if (block.Url != null && !string.IsNullOrWhiteSpace(block.Url.ToString()))
                    {
                        if (Uri.TryCreate(block.Url.ToString(), UriKind.RelativeOrAbsolute, out const uri))
                        {
                            link: linkItemViewModelBuilder.Build(null, uri);
                        }
                    }
        
                    return {
                        heading: block.Heading,
                        mainBody: richTextAreaPropsBuilder.Build({
                            richTextArea: block.MainBody,
                            propertyName: "block.MainBody"
                        }),
                        linkLocation: link,
                        buttonText: buttonText,
                        image: imagePropsBuilder.Build(block.Image),
                        imageAltText: block.ImageAltText,
                        ope: withOnPageEdit ? {} : null
                    }
        */
                const props = cmsPageData?.properties ?? {};
        let bodyData = {
            componentName: "AdvisorStartBlock",
            heading: props?.heading ?? null,
            mainBody: props?.mainBody ?? null,
            linkLocation: props?.linkLocation ?? null,
            buttonText: props?.buttonText ?? null,
            image: props?.image ?? null,
            imageAltText: props?.imageAltText ?? null,
            ope: props?.ope ?? null,
        };

        return bodyData;
    }
}







