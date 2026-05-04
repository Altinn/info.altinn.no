import type { IJSONTransformer } from "../IJSONTransformer";

export class ContactFormBlockTransformer implements IJSONTransformer {
    public Transform(cmsPageData:any):any {
        /* C# logic (TS-ish++):
        if (block: = null) return null;
                    const culture: CultureInfo.CurrentCulture.NormalizeCulture();
                    const startpage: contentLoader.Get<StartPage>(ContentReference.StartPage);
        
                    return {
                        heading: block.Heading,
                        contactHeading: block.ContactHeading,
                        text: block.ContactHeading,
                        showAttachment: block.ShowAttachment,
                        startCompanyFormat: block.StartCompanyFormat,
                        supportEmail: block.SupportEmail,
                        locationSuccessUrl: block.LocationSuccess != null ? urlResolver.GetUrl(block.LocationSuccess) : "",
                        locationErrorUrl: block.LocationError != null ? urlResolver.GetUrl(block.LocationError) : "",
                        formId: "form-" + Guid.NewGuid().ToString("N"),
                        useRecaptcha: startPage.UseRecaptcha,
                        recaptchaSiteKey: startPage.ReCaptchaSiteKey,
                        schemaId: isIContent(block) blockContent ? blockContent.ContentLink.iD: 0,
                        labels: BuildContactFormLabels(localizationService, culture),
                        ope: withOnPageEdit ? {} : null
                    }
        */
                const props = cmsPageData?.properties ?? {};
        let bodyData = {
            componentName: "ContactFormBlock",
            heading: props?.heading ?? null,
            contactHeading: props?.contactHeading ?? null,
            text: props?.text ?? null,
            showAttachment: props?.showAttachment ?? null,
            startCompanyFormat: props?.startCompanyFormat ?? null,
            supportEmail: props?.supportEmail ?? null,
            locationSuccessUrl: props?.locationSuccessUrl ?? null,
            locationErrorUrl: props?.locationErrorUrl ?? null,
            formId: props?.formId ?? null,
            useRecaptcha: props?.useRecaptcha ?? null,
            recaptchaSiteKey: props?.recaptchaSiteKey ?? null,
            schemaId: props?.schemaId ?? null,
            labels: props?.labels ?? null,
            ope: props?.ope ?? null,
        };

        return bodyData;
    }
}







