import type { IJSONTransformer } from "../IJSONTransformer";
import { fetchUmbracoAncestors } from "../../../api/umbraco/client";
import { BreadcrumbsTransformer } from "../../BreadcrumbsTransformer";
import type { SchemaOverviewPageViewModel } from "../../../Models/Generated/SchemaOverviewPageViewModel";

export class SchemaOverviewPageTransformer implements IJSONTransformer {
  public async Transform(cmsPageData: any): Promise<SchemaOverviewPageViewModel> {
    /* C# logic (TS-ish++):
    const httpcontext: httpContextAccessor.HttpContext;
            const culture: CultureInfo.CurrentCulture.NormalizeCulture();
    
            const initialtab: "category";
            if (httpContext?.Request.Query.TryGetValue("category", out const categoryParam) == true)
            {
                const categoryvalue: categoryParam.ToString().ToLowerInvariant();
                if (categoryvalue: = "provider")
                    initialtab: "provider";
            }
    
            const categories: schemaRelationsService.GetCategory(culture.Name);
    
            if (categories: = null || categories.count: = 0)
                return null;
    
            const providers: schemaRelationsService.GetProviders(culture.Name);
    
            const startpage: contentLoader.Get<StartPage>(ContentReference.StartPage);
            const searchpageUrl: startPage.SearchPage != null
                ? urlResolver.GetUrl(startPage.SearchPage, culture.Name, { contextMode: ContextMode.Default })
                : null;
    
            const recommendedschemas: currentPage.RecommendedSchemas?.Items != null
                ? schemaViewModelService.BuildRecommendedSchemasForOverview(
                    currentPage.RecommendedSchemas.Items,
                    culture.Name)
                : [];
    
            const providerviewModels: providers.map(p: >
            {
                const organization: ResolveOrganization(p.Acronym, p.OrgNr, p.Heading, culture.Name);
    
                return {
                    name: p.Heading,
                    url: urlResolver.GetUrl(p.ContentLink, culture.Name, { contextMode: ContextMode.Default }),
                    imageUrl: organization?.GetImageUrl(),
                };
            });
    
            return {
                ope: withOnPageEdit ? new() : null,
                fullRefreshProperties: withOnPageEdit ? ["currentPage.MainBody"] : null,
                title: localizationService.GetStringByCulture("/schema/allservices", culture),
                suggestions: localizationService.GetStringByCulture("/schema/suggestions", culture),
                agencyText: localizationService.GetStringByCulture("/schema/agency", culture),
                providersText: localizationService.GetStringByCulture("/search/providers", culture),
                servicesText: localizationService.GetStringByCulture("/schema/allservices", culture),
                schemaCategories: categories.map(x: > MapToViewModel(x, culture)),
                providerCollections: GroupProvidersByLetter(providerViewModels, culture),
                breadcrumb: breadcrumbViewModelBuilder.Build({ currentPage: currentPage }),
                recommendedSchemasHeaderText: localizationService.GetStringByCulture("/schema/related/relevantschemasheader", culture),
                recommendedSchemas: recommendedSchemas,
                initialTab: initialTab,
                searchPageUrl: searchPageUrl,
                searchPlaceholder: localizationService.GetStringByCulture("/search/searchaftercontent", culture),
                searchAriaLabel: localizationService.GetStringByCulture("/search/searcharialabel", culture)
            }
    */
        const ancestors = await fetchUmbracoAncestors(cmsPageData.id);
    const breadcrumb = BreadcrumbsTransformer.Transform(ancestors, cmsPageData);
    return {
      componentName: "SchemaOverviewPage",
      renderAlternateHeader: cmsPageData.properties.renderAlternateHeader || false,
      title: cmsPageData.properties.title || undefined,
      suggestions: cmsPageData.properties.suggestions || undefined,
      breadcrumb: breadcrumb,
      schemaCategories: cmsPageData.properties.schemaCategories || [],
      providerCollections: cmsPageData.properties.providerCollections || [],
      agencyText: cmsPageData.properties.agencyText || undefined,
      servicesText: cmsPageData.properties.servicesText || undefined,
      providersText: cmsPageData.properties.providersText || undefined,
      recommendedSchemasHeaderText: cmsPageData.properties.recommendedSchemasHeaderText || undefined,
      recommendedSchemas: cmsPageData.properties.recommendedSchemas || [],
      initialTab: cmsPageData.properties.initialTab || undefined,
      ...cmsPageData.properties,
    } as SchemaOverviewPageViewModel;
  }
}













