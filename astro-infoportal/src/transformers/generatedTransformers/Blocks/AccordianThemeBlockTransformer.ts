import type { IJSONTransformer } from "../IJSONTransformer";

export class AccordianThemeBlockTransformer implements IJSONTransformer {
    public Transform(cmsPageData:any):any {
        /* C# logic (TS-ish++):
        return {
                        heading: block.Heading,
                        themePageArea: contentAreaPropsBuilder.Build({
                            contentArea: block.ThemePageArea,
                            propertyName: "block.ThemePageArea"
                        }),
                        goToLinkText: block.GoToLinkText,
                        goToLinkLocation: linkItemViewModelBuilder.Build(block.GoToLinkText, block.GoToLinkLocation),
                        image: imagePropsBuilder.Build(block.Image),
                        ope: withOnPageEdit ? {} : null
                    }
        */
                const props = cmsPageData?.properties ?? {};
        let bodyData = {
            componentName: "AccordianThemeBlock",
            heading: props?.heading ?? null,
            themePageArea: props?.themePageArea ?? null,
            goToLinkText: props?.goToLinkText ?? null,
            goToLinkLocation: props?.goToLinkLocation ?? null,
            image: props?.image ?? null,
            ope: props?.ope ?? null,
        };

        return bodyData;
    }
}







