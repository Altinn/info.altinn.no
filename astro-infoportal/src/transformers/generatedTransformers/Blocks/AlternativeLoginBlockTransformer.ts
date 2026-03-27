import type { IJSONTransformer } from "../IJSONTransformer";

export class AlternativeLoginBlockTransformer implements IJSONTransformer {
    public Transform(cmsPageData:any):any {
        /* C# logic (TS-ish++):
        return {
                        primaryButtonIntroduction: currentBlock.PrimaryButtonIntroduction,
                        primaryButtonText: currentBlock.PrimaryButtonText,
                        primaryButtonTarget: currentBlock.PrimaryButtonTarget?.ToString(),
                        secondaryLinkIntroduction: currentBlock.SecondaryLinkIntroduction,
                        secondaryLinkText: currentBlock.SecondaryLinkText,
                        secondaryLinkTarget: currentBlock.SecondaryLinkTarget?.ToString(),
                        activated: currentBlock.Activated,
                        ope: withOnPageEdit ? {} : null
                    }
        */
                const props = cmsPageData?.properties ?? {};
        let bodyData = {
            componentName: "AlternativeLoginBlock",
            primaryButtonIntroduction: props?.primaryButtonIntroduction ?? null,
            primaryButtonText: props?.primaryButtonText ?? null,
            primaryButtonTarget: props?.primaryButtonTarget ?? null,
            secondaryLinkIntroduction: props?.secondaryLinkIntroduction ?? null,
            secondaryLinkText: props?.secondaryLinkText ?? null,
            secondaryLinkTarget: props?.secondaryLinkTarget ?? null,
            activated: props?.activated ?? null,
            ope: props?.ope ?? null,
        };

        return bodyData;
    }
}







