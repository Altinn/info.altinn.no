import type { IJSONTransformer } from "../IJSONTransformer";

// Image lookup keyed by block heading. Heading text varies per locale and even
// within a locale (definite vs indefinite Norwegian forms, editor typos with
// trailing spaces), so every observed variant is enumerated here. Lookup is
// normalized (trim + lowercase) before matching. Note: nynorsk collapses the
// definite/indefinite bokmål forms to one heading; where that happens the nynorsk
// entry mirrors the definite form's image.
const ADVISOR_START_BLOCK_IMAGE_MAP_RAW: Record<string, { src: string; alt: string }> = {
    // valg av organisasjonsform
    "Veileder for valg av organisasjonsform": {
        src: "/assets/img/illustrasjon_arbeidsforhold_sirkel.svg",
        alt: "Illustrasjon for veileder organisasjonsform",
    },
    "Rettleiar for val av organisasjonsform": {
        src: "/assets/img/illustrasjon_arbeidsforhold_sirkel.svg",
        alt: "Illustrasjon for rettleiar organisasjonsform",
    },
    "Tutorial for choosing legal structure": {
        src: "/assets/img/illustrasjon_arbeidsforhold_sirkel.svg",
        alt: "Illustration for choosing legal structure",
    },

    // enkeltpersonforetak — indefinite NB form
    "Oppstartsveileder for enkeltpersonforetak": {
        src: "/assets/img/altinn-veileder-sirkel.svg",
        alt: "Illustrasjon for veileder enkeltpersonforetak",
    },
    "Startup tutorial for sole proprietorships": {
        src: "/assets/img/altinn-veileder-sirkel.svg",
        alt: "Illustration for sole proprietorship tutorial",
    },

    // enkeltpersonforetak — definite NB form (used on the "oppstartsveileder-for-enkeltpersonforetak" page)
    "Oppstartsveilederen for enkeltpersonforetak": {
        src: "/assets/img/illustrasjon_loginn_sirkel_2.svg",
        alt: "Illustrasjon for veileder enkeltpersonforetak",
    },
    "Oppstartsrettleiar for enkeltpersonføretak": {
        src: "/assets/img/illustrasjon_loginn_sirkel_2.svg",
        alt: "Illustrasjon for rettleiar enkeltpersonføretak",
    },
    "Start-up tutorial for sole proprietorship": {
        src: "/assets/img/illustrasjon_loginn_sirkel_2.svg",
        alt: "Illustration for sole proprietorship tutorial",
    },

    // aksjeselskap — indefinite NB form
    "Oppstartsveileder for aksjeselskap": {
        src: "/assets/img/illustrasjon_regnskap_og_revisjon_sirkel.svg",
        alt: "Illustrasjon for veileder aksjeselskap",
    },
    "Startup tutorial for private limited company": {
        src: "/assets/img/illustrasjon_regnskap_og_revisjon_sirkel.svg",
        alt: "Illustration for private limited company tutorial",
    },

    // aksjeselskap — definite NB form (used on the "oppstartsveileder-for-enkeltpersonforetak" page)
    "Oppstartsveilederen for aksjeselskap": {
        src: "/assets/img/illustrasjon_loginn_sirkel_1.svg",
        alt: "Illustrasjon for veileder aksjeselskap",
    },
    "Oppstartsrettleiar for aksjeselskap": {
        src: "/assets/img/illustrasjon_loginn_sirkel_1.svg",
        alt: "Illustrasjon for rettleiar aksjeselskap",
    },
    "Start-up tutorial for private limited company": {
        src: "/assets/img/illustrasjon_loginn_sirkel_1.svg",
        alt: "Illustration for private limited company tutorial",
    },

    // serveringsbransjen
    "Veileder for serveringsbransjen": {
        src: "/assets/img/illustrasjon_hjelp_sirkel_1.svg",
        alt: "Illustrasjon for veileder serveringsbransjen",
    },
    "Rettleiar for serveringsbransjen": {
        src: "/assets/img/illustrasjon_hjelp_sirkel_1.svg",
        alt: "Illustrasjon for rettleiar serveringsbransjen",
    },
    "Tutorial for the food and beverage services sector": {
        src: "/assets/img/illustrasjon_hjelp_sirkel_1.svg",
        alt: "Illustration for the food and beverage services sector",
    },

    // renholdsbransjen / reinhaldsbransjen
    "Veileder for renholdsbransjen": {
        src: "/assets/img/illustrasjon_skatt_og_avgift_sirkel.svg",
        alt: "Veileder for renholdsbransjen",
    },
    "Rettleiar for reinhaldsbransjen": {
        src: "/assets/img/illustrasjon_skatt_og_avgift_sirkel.svg",
        alt: "Rettleiar for reinhaldsbransjen",
    },
    "Guide for the cleaning industry": {
        src: "/assets/img/illustrasjon_skatt_og_avgift_sirkel.svg",
        alt: "Guide for the cleaning industry",
    },

    // frisørbransjen
    "Veiledning for frisørbransjen": {
        src: "/assets/img/illustrasjon_loginn_sirkel_1.svg",
        alt: "Illustrasjon for veileder frisør",
    },
    "Rettleiing for frisørbransjen": {
        src: "/assets/img/illustrasjon_loginn_sirkel_1.svg",
        alt: "Illustrasjon for rettleiar frisør",
    },
    "Guidance for the hairdressing industry": {
        src: "/assets/img/illustrasjon_loginn_sirkel_1.svg",
        alt: "Guidance for the hairdressing industry",
    },

    // byggebransjen
    "Veiledning for byggebransjen": {
        src: "/assets/img/illustrasjon_starte_og_drive_sirkel.svg",
        alt: "Illustrasjon for veileder elektriker og rørlegger",
    },
    "Rettleiing for byggebransjen": {
        src: "/assets/img/illustrasjon_starte_og_drive_sirkel.svg",
        alt: "Illustrasjon for rettleiar elektrikar og røyrleggjar",
    },
    "Guidance for the construction industry": {
        src: "/assets/img/illustrasjon_starte_og_drive_sirkel.svg",
        alt: "Guidance for the construction industry",
    },

    // varebransjen
    "Veiledning for varebransjen": {
        src: "/assets/img/illustrasjon_arbeidsforhold_sirkel.svg",
        alt: "Illustrasjon for veileder varebransjen",
    },
    "Rettleiing for varebransjen": {
        src: "/assets/img/illustrasjon_arbeidsforhold_sirkel.svg",
        alt: "Illustrasjon for rettleiar varebransjen",
    },
    "Guidance for the retail industry": {
        src: "/assets/img/illustrasjon_arbeidsforhold_sirkel.svg",
        alt: "Guidance for the retail industry",
    },
};

const normalizeHeadingKey = (s: string): string => s.trim().toLowerCase();

const ADVISOR_START_BLOCK_IMAGE_MAP: Record<string, { src: string; alt: string }> =
    Object.fromEntries(
        Object.entries(ADVISOR_START_BLOCK_IMAGE_MAP_RAW).map(([k, v]) => [
            normalizeHeadingKey(k),
            v,
        ]),
    );

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
                    ? ADVISOR_START_BLOCK_IMAGE_MAP[normalizeHeadingKey(props.heading)] ?? null
                    : null;
                const linkLocation = props?.url
                    ? {
                            componentName: "LinkItem",
                            text: props?.buttonText ?? null,
                            url: props.url,
                        }
                    : null;
                const image = props?.image
                    ? {
                        componentName: "Image",
                        src: props?.image[0]?.url
                    }
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







