import type { IJSONTransformer } from "../IJSONTransformer";

export class ContactListBlockTransformer implements IJSONTransformer {
    public Transform(cmsPageData:any):any {
        /* C# logic (TS-ish++):
        const culture: ContentLanguage.PreferredCulture;
                    const contactformPageData: GetContactFormPageData(block);
                    const contactformConfiguration: GetContactFormConfiguration(block);
        
                    return {
                        contactHeading: block.ContactHeading ?? "",
                        text: richTextAreaPropsBuilder.Build({ richTextArea: block.Text, propertyName: "block.Text" }, withOnPageEdit),
                        button1: linkItemViewModelBuilder.Build(block.Button1, withOnPageEdit),
                        useContactNumberButton: block.UseContactNumberButton,
                        contactNumber: block.ContactNumber ?? "",
                        contactNumberText: localizationService.GetStringByCulture("/support/contacttelephone", culture),
                        button2: linkItemViewModelBuilder.Build(block.Button2, withOnPageEdit),
                        useContactFormButton: block.UseContactFormButton,
                        contactFormLocation: BuildLink("/support/contactform", block.ContactFormLocation, culture),
                        button3: linkItemViewModelBuilder.Build(block.Button3, withOnPageEdit),
        
                        contactFormPageData: contactFormPageData,
        
                        contactFormSchemaId: contactFormConfiguration.SchemaId,
                        showAttachment: contactFormConfiguration.ShowAttachment,
                        useRecaptcha: contactFormPageData?.UseRecaptcha ?? contactFormConfiguration.UseRecaptcha,
                        recaptchaSiteKey: contactFormPageData?.RecaptchaSiteKey ?? contactFormConfiguration.RecaptchaSiteKey,
                        labels: BuildContactFormLabels(culture),
                        ope: withOnPageEdit ? {} : null
                    }
        */
                const props = cmsPageData?.properties ?? {};
        let bodyData = {
            componentName: "ContactListBlock",
            contactHeading: props?.contactHeading ?? null,
            text: props?.text ?? null,
            button1: props?.button1 ?? null,
            useContactNumberButton: props?.useContactNumberButton ?? null,
            contactNumber: props?.contactNumber ?? null,
            contactNumberText: props?.contactNumberText ?? null,
            button2: props?.button2 ?? null,
            useContactFormButton: props?.useContactFormButton ?? null,
            contactFormLocation: props?.contactFormLocation ?? null,
            button3: props?.button3 ?? null,
            contactFormPageData: props?.contactFormPageData ?? null,
            contactFormSchemaId: props?.contactFormSchemaId ?? null,
            showAttachment: props?.showAttachment ?? null,
            useRecaptcha: props?.useRecaptcha ?? null,
            recaptchaSiteKey: props?.recaptchaSiteKey ?? null,
            labels: props?.labels ?? null,
            ope: props?.ope ?? null,
        };

        return bodyData;
    }
}







