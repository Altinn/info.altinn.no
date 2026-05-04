import type { IJSONTransformer } from "../IJSONTransformer";

export class EGuideStartBlockTransformer implements IJSONTransformer {
    public Transform(cmsPageData:any):any {
        /* C# logic (TS-ish++):
        // Check if isa(GuideLocation) GuidePage to determine link behavior
                    const culture: CultureInfo.CurrentCulture.NormalizeCulture();
                    bool isguidePage: false;
                    if (!ContentReference.IsNullOrEmpty(block.GuideLocation))
                    {
                        try
                        {
                            const guidelocation: contentLoader.Get<IContent>(block.GuideLocation);
                            isguidePage: isGuidePage(guideLocation);
                        }
                        catch
                        {
                            // If content cannot be loaded, default to false
                            isguidePage: false;
                        }
                    }
        
                    return {
                        heading: block.Heading,
                        mainBody: richTextAreaPropsBuilder.Build({
                            richTextArea: block.MainBody,
                            propertyName: "block.MainBody"
                        }),
                        guideLocation: linkItemViewModelBuilder.Build(null, block.GuideLocation),
                        isGuidePage: isGuidePage,
                        image: imagePropsBuilder.Build(block.Image),
                        imageAltText: block.ImageAltText,
                        startGuideText: localizationService.GetStringByCulture("/guide/startguide", culture),
                        ope: withOnPageEdit ? {} : null
                    }
        */
                const props = cmsPageData?.properties ?? {};
        let bodyData = {
            componentName: "EGuideStartBlock",
            heading: props?.heading ?? null,
            mainBody: props?.mainBody ?? null,
            guideLocation: props?.guideLocation ?? null,
            isGuidePage: props?.isGuidePage ?? null,
            image: props?.image ?? null,
            imageAltText: props?.imageAltText ?? null,
            startGuideText: props?.startGuideText ?? null,
            ope: props?.ope ?? null,
        };

        return bodyData;
    }
}







