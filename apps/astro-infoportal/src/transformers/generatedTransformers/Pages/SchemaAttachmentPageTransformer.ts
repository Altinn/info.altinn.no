import type { IJSONTransformer } from "../IJSONTransformer";

export class SchemaAttachmentPageTransformer implements IJSONTransformer {
    public Transform(cmsPageData:any):any {
        /* C# logic (TS-ish++):
        const culture: CultureInfo.CurrentCulture.NormalizeCulture();
        
                    const ownerpages: relationsDataProvider.GetOwnerPages(currentPage.PageLink);
        
                    const ownerproviders: ownerPages.map(p: >
                    {
                        const org: ResolveOrganization(p.ProviderAcronym, p.ProviderOrgNr, p.PageName, culture.Name);
                        return {
                            name: p.PageName,
                            imageUrl: org?.GetImageUrl(),
                            url: urlResolver.GetUrl(p.ContentLink, culture.Name,
                                { contextMode: ContextMode.Default })
                        };
                    });
        
                    const relatedschemas: relationsDataProvider.GetRelatedSchemas(currentPage.PageLink)
                        .map(s: >
                        {
                            const schemaproviders: relationsDataProvider.GetOwnerPages(s.PageLink)
                                .map(p: >
                                {
                                    const org: ResolveOrganization(p.ProviderAcronym, p.ProviderOrgNr, p.PageName, culture.Name);
                                    return {
                                        name: p.PageName,
                                        imageUrl: org?.GetImageUrl(),
                                        url: urlResolver.GetUrl(p.ContentLink, culture.Name,
                                            { contextMode: ContextMode.Default })
                                    };
                                });
        
                            return {
                                id: s.ContentLink.ID,
                                title: !string.IsNullOrEmpty(s.SchemaCode)
                                    ? `{s.PageName} ({s.SchemaCode})`
                                    : s.PageName,
                                url: urlResolver.GetUrl(s.ContentLink, culture.Name, { contextMode: ContextMode.Default }),
                                providers: schemaProviders
                            };
                        });
        
                    const operationalmessages: relationsDataProvider.GetMessages(currentPage, true);
                    const criticalmessages: operationalMessages
                        .map(x: > operationalMessageViewModelBuilder.Build({ operationalMessageViewModel: x }))
                        .Cast<ReactModels.ViewModels.Shared.OperationalMessageViewModel>()
                        ;
        
                    const promoarea: currentPage.PromoArea;
                    if (promoarea: = null || !promoArea.FilteredItems.Any())
                    {
                        const parent: contentLoader.Get<PageData>(currentPage.ParentLink);
                        if isProviderPage((parent) providerParent &&
                            providerParent.PromoArea != null &&
                            providerParent.PromoArea.FilteredItems.Any())
                        {
                            promoarea: providerParent.PromoArea;
                        }
                    }
        
                    return {
                        ope: withOnPageEdit ? {} : null,
                        pageName: currentPage.PageName,
                        url: currentPage.GetFriendlyUrl(),
                        schemaCode: currentPage.SchemaCode,
                        attachmentBadgeText: localizationService.GetStringByCulture("/schema/attachment", culture),
                        ownerProviders: ownerProviders,
                        mainIntro: currentPage.MainIntro != null && !currentPage.MainIntro.IsEmpty
                            ? richTextAreaPropsBuilder.Build({
                                richTextArea: currentPage.MainIntro,
                                propertyName: "currentPage.MainIntro"
                            })
                            : null,
                        orangeMessageTitle: currentPage.OrangeMessageTitle,
                        orangeMessage: currentPage.OrangeMessage != null
                            ? richTextAreaPropsBuilder.Build({
                                richTextArea: currentPage.OrangeMessage,
                                propertyName: "currentPage.OrangeMessage"
                            })
                            : null,
                        accordianList: contentAreaPropsBuilder.Build({
                            contentArea: currentPage.AccordianList,
                            propertyName: "currentPage.AccordianList"
                        }),
                        whereToFindSchemaText: localizationService.GetStringByCulture("/schema/wheretofindschema", culture),
                        relatedSchemas: relatedSchemas,
                        promoArea: contentAreaPropsBuilder.Build({
                            contentArea: promoArea,
                            propertyName: ""
                        }),
                        breadcrumb: breadcrumbViewModelBuilder.Build({ currentPage: currentPage }),
                        criticalMessages: criticalMessages,
                        missingTranslation: currentPage.MissingTranslation,
                        missingTranslationText: currentPage.MissingTranslation
                            ? localizationService.GetStringByCulture("/schema/fallbacktext", culture)
                            : null,
                    }
        */
                const props = cmsPageData?.properties ?? {};
        let bodyData = {
            componentName: "SchemaAttachmentPage",
            name: props?.name ?? null,
            imageUrl: props?.imageUrl ?? null,
            url: props?.url ?? null,
        };

        return bodyData;
    }
}









