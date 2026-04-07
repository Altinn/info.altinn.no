import type { IJSONTransformer } from "../IJSONTransformer";

export class RelevantSchemasBlockTransformer implements IJSONTransformer {
    public Transform(cmsPageData:any):any {
        /* C# logic (TS-ish++):
        const culture: CultureInfo.CurrentCulture.NormalizeCulture();
                    const schemaoverviewPageUrl: currentBlock.ShowMeMore != null
                        ? urlResolver.GetUrl(currentBlock.ShowMeMore, culture.Name, { contextMode: ContextMode.Default })
                        : null;
        
                    // Use the new service to build schemas with batch loading and "and more" text
                    const schemas: currentBlock.ContentArea?.Items != null
                        ? schemaViewModelService.BuildRecommendedSchemasForBlock(
                            currentBlock.ContentArea.Items,
                            culture.Name)
                        : [];
        
                    return {
                        schemas: schemas,
                        relevantSchemasHeader: localizationService.GetStringByCulture("/schema/related/relevantschemasheader", culture),
                        schemaOverviewPageUrl: schemaOverviewPageUrl,
                        showAllSchemasText: localizationService.GetStringByCulture("/common/showallschemas", culture),
                        ope: withOnPageEdit ? {} : null,
                    }
        */
                const props = cmsPageData?.properties ?? {};
        let bodyData = {
            componentName: "RelevantSchemasBlock",
            schemas: props?.schemas ?? null,
            relevantSchemasHeader: props?.relevantSchemasHeader ?? null,
            schemaOverviewPageUrl: props?.schemaOverviewPageUrl ?? null,
            showAllSchemasText: props?.showAllSchemasText ?? null,
            ope: props?.ope ?? null,
        };

        return bodyData;
    }
}







