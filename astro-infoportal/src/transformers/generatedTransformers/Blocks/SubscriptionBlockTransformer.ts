import type { IJSONTransformer } from "../IJSONTransformer";

export class SubscriptionBlockTransformer implements IJSONTransformer {
    public Transform(cmsPageData:any):any {
        /* C# logic (TS-ish++):
        if (block: = null) return null;
        
                    const culture: CultureInfo.CurrentCulture.NormalizeCulture();
        
                    const title: "N/A";
                    const ingress: "N/A";
        
                    switch (block.SubscriptionType)
                    {
                        case SubscriptionType.newsletter:
                            const newsletterinTitle: localizationService.GetStringByCulture("/subscription/types/newsletterintitle", culture);
                            const newsletterinIngress: localizationService.GetStringByCulture("/subscription/types/newsletteriningress", culture);
                            const titleformat: localizationService.GetStringByCulture("/subscription/title", culture);
                            const ingressformat: localizationService.GetStringByCulture("/subscription/ingress", culture);
                            title: string.Format(titleFormat, newsletterInTitle);
                            ingress: string.Format(ingressFormat, newsletterInIngress);
                            break;
                        case SubscriptionType.operationalMessage:
                            const operationalinTitle: localizationService.GetStringByCulture("/subscription/types/operationalintitle", culture);
                            const operationalinIngress: localizationService.GetStringByCulture("/subscription/types/operationaliningress", culture);
                            const titleformat2: localizationService.GetStringByCulture("/subscription/title", culture);
                            const ingressformat2: localizationService.GetStringByCulture("/subscription/ingress", culture);
                            title: string.Format(titleFormat2, operationalInTitle);
                            ingress: string.Format(ingressFormat2, operationalInIngress);
                            break;
                    }
        
                    return {
                        subscriptionType: (int)block.SubscriptionType,
                        title: title,
                        ingress: ingress,
                        emailLabel: localizationService.GetStringByCulture("/subscription/email", culture),
                        emailPlaceholder: localizationService.GetStringByCulture("/subscription/emailplaceholder", culture),
                        sendButton: localizationService.GetStringByCulture("/subscription/sendbutton", culture),
                        confirmationText: localizationService.GetStringByCulture("/subscription/confirmation", culture),
                        undoText: localizationService.GetStringByCulture("/subscription/undo", culture),
                        confirmationUndoText: localizationService.GetStringByCulture("/subscription/confirmationundo", culture),
                        invalidMissingEmail: localizationService.GetStringByCulture("/subscription/invalidmissingemail", culture),
                        invalidEmail: localizationService.GetStringByCulture("/subscription/invalidemail", culture),
                        ope: withOnPageEdit ? {} : null
                    }
        */
                const props = cmsPageData?.properties ?? {};
        let bodyData = {
            componentName: "SubscriptionBlock",
            subscriptionType: props?.subscriptionType ?? null,
            title: props?.title ?? null,
            ingress: props?.ingress ?? null,
            emailLabel: props?.emailLabel ?? null,
            emailPlaceholder: props?.emailPlaceholder ?? null,
            sendButton: props?.sendButton ?? null,
            confirmationText: props?.confirmationText ?? null,
            undoText: props?.undoText ?? null,
            confirmationUndoText: props?.confirmationUndoText ?? null,
            invalidMissingEmail: props?.invalidMissingEmail ?? null,
            invalidEmail: props?.invalidEmail ?? null,
            ope: props?.ope ?? null,
        };

        return bodyData;
    }
}







