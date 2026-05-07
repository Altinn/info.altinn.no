import type { IJSONTransformer } from "../IJSONTransformer";

const ADVISOR_START_BLOCK_IMAGE_MAP: Record<string, { src: string; alt: string }> = {
    "Veileder for valg av organisasjonsform": {
        src: "/assets/img/illustrasjon_arbeidsforhold_sirkel.svg",
        alt: "Illustrasjon for veileder organisasjonsform",
    },
    "Oppstartsveileder for enkeltpersonforetak": {
        src: "/assets/img/altinn-veileder-sirkel.svg",
        alt: "Illustrasjon for veileder enkeltpersonforetak",
    },
    "Oppstartsveileder for aksjeselskap": {
        src: "/assets/img/illustrasjon_regnskap_og_revisjon_sirkel.svg",
        alt: "Illustrasjon for veileder aksjeselskap",
    },
    "Veileder for serveringsbransjen": {
        src: "/assets/img/illustrasjon_hjelp_sirkel_1.svg",
        alt: "Illustrasjon for veileder serveringsbransjen",
    },
    "Veileder for renholdsbransjen": {
        src: "/assets/img/illustrasjon_skatt_og_avgift_sirkel.svg",
        alt: "Veileder for renholdsbransjen",
    },
    "Veiledning for frisørbransjen": {
        src: "/assets/img/illustrasjon_loginn_sirkel_1.svg",
        alt: "Illustrasjon for veileder frisør",
    },
    "Veiledning for byggebransjen": {
        src: "/assets/img/illustrasjon_starte_og_drive_sirkel.svg",
        alt: "Illustrasjon for veileder elektriker og rørlegger",
    },
    "Veiledning for varebransjen": {
        src: "/assets/img/illustrasjon_arbeidsforhold_sirkel.svg",
        alt: "Illustrasjon for veileder varebransjen",
    },
};

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
                const imageFallback = props?.heading
                    ? ADVISOR_START_BLOCK_IMAGE_MAP[props.heading] ?? null
                    : null;
                const linkLocation = props?.url
                    ? {
                            componentName: "LinkItem",
                            text: props?.buttonText ?? null,
                            url: props.url,
                        }
                    : null;
                const image = props?.image
                    ? props.image
                    : imageFallback
                        ? {
                            componentName: "Image",
                            src: imageFallback.src,
                        }
                        : null;

                let bodyData = {
            componentName: "AdvisorStartBlock",
            heading: props?.heading ?? null,
            mainBody: props?.mainBody ?? null,
                        linkLocation,
            buttonText: props?.buttonText ?? null,
            image,
            imageAltText: props?.imageAltText ?? imageFallback?.alt ?? null,
            ope: props?.ope ?? null,
        };

        return bodyData;
    }
}







