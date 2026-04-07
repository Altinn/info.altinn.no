import type { IJSONTransformer } from "../IJSONTransformer";
import { fetchUmbracoAncestors } from "../../../api/umbraco/client";
import { BreadcrumbsTransformer } from "../../BreadcrumbsTransformer";

export class ProviderPageTransformer implements IJSONTransformer {
    public async Transform(cmsPageData:any): Promise<any> {
        /* C# logic (TS-ish++):
        const culture: CultureInfo.CurrentCulture.NormalizeCulture();
                    const contentid: currentPage.ContentLink.ID;
                    const showalleSchemasText: `{localizationService.GetStringByCulture(`/schema/showallschemas", culture)} {currentPage.PageName}";
        
                    const organization: ResolveOrganization(currentPage.ProviderAcronym, currentPage.ProviderOrgNr, currentPage.PageName, culture.Name);
        
                    const allproviders: schemaRelationsService.GetProviders(culture.Name);
                    const currentproviderData: allProviders.FirstOrDefault(p: > p.id: = currentPage.ContentLink.ID);
                    const schemas: currentProviderData?.List ?? [];
        
                    const operationalmessages: relationsDataProvider.GetMessages(currentPage, true);
        
                    return {
                        pageName: currentPage.PageName,
                        showAllSchemesLinKText: showAlleSchemasText,
                        breadcrumb: breadcrumbViewModelBuilder.Build({ currentPage: currentPage }),
                        mainIntro: richTextAreaPropsBuilder.Build({
                            richTextArea: currentPage.MainIntro,
                            propertyName: "currentPage.MainIntro"
                        }),
                        operationalMessages: operationalMessages.map(x: > operationalMessageViewModelBuilder.Build({ operationalMessageViewModel: x })),
                        schemas: schemas.map(x: > {
                            id: x.Id,
                            title: x.Title,
                            url: x.Url,
                            providers: x.Providers.map(p: >
                            {
                                const org: ResolveOrganization(p.Acronym, p.OrgNr, p.Name, culture.Name);
                                return {
                                    name: p.Name,
                                    imageUrl: org?.GetImageUrl(),
                                    url: p.Url
                                };
                            })
                        }),
                        url: urlResolver.GetUrl(currentPage.ContentLink, culture.Name, { contextMode: ContextMode.Default }),
                        providerIcon: {
                            name: currentPage.PageName,
                            imageUrl: organization?.GetImageUrl(),
                            url: currentPage.LinkURL
                        },
                        contactInfo: BuildContactInfo(currentPage),
                    }
        */
        const props = cmsPageData?.properties ?? {};
        const ancestors = await fetchUmbracoAncestors(cmsPageData.id);
        const breadcrumb = BreadcrumbsTransformer.Transform(ancestors, cmsPageData);
        let bodyData = {
            componentName: "ProviderPage",
            pageName: cmsPageData?.name ?? null,
            showAllSchemesLinKText: props?.showAllSchemesLinKText ?? null,
            breadcrumb: breadcrumb,
            mainIntro: props?.mainIntro ?? null,
            operationalMessages: props?.operationalMessages ?? null,
            schemas: props?.schemas ?? null,
            url: props?.url ?? null,
            providerIcon: props?.providerIcon ?? null,
            contactInfo: props?.contactInfo ?? null,
        };

        return bodyData;
    }
}









