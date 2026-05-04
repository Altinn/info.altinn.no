import type { IJSONTransformer } from "../IJSONTransformer";

export class ContactFormPageTransformer implements IJSONTransformer {
    public Transform(cmsPageData:any):any {
        /* C# logic (TS-ish++):
        const startpage: _contentLoader.Get<StartPage>(ContentReference.StartPage);
        
                    return {
                        pageName: page.PageName,
                        teaserHeading: page.TeaserHeading,
                        teaserText: _richTextAreaPropsBuilder.Build({ richTextArea: page.TeaserText}),
                        formTypeArea: _contentAreaPropsBuilder.Build({
                            contentArea: page.FormTypeArea,
                            propertyName: "page.FormTypeArea"
                        }, withOnPageEdit),
                        useRecaptcha: startPage.UseRecaptcha,
                        recaptchaSiteKey: startPage.ReCaptchaSiteKey,
                        ope: withOnPageEdit ? {} : null
                    }
        */
                const props = cmsPageData?.properties ?? {};
        let bodyData = {
            componentName: "ContactFormPage",
            pageName: cmsPageData?.name ?? null,
            teaserHeading: props?.teaserHeading ?? null,
            teaserText: props?.teaserText ?? null,
            formTypeArea: props?.formTypeArea ?? null,
            useRecaptcha: props?.useRecaptcha ?? null,
            recaptchaSiteKey: props?.recaptchaSiteKey ?? null,
            ope: props?.ope ?? null,
        };

        return bodyData;
    }
}









