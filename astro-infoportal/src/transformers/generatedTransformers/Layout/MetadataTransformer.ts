import type { IJSONTransformer } from "../IJSONTransformer";

export class MetadataTransformer implements IJSONTransformer {
    public Transform(cmsPageData:any):any {
        /* C# logic (TS-ish++): (no Build body found) */
                const props = cmsPageData?.properties ?? {};
        let bodyData = {
            componentName: "Metadata",
            title: props?.title ?? null,
            htmlLanguage: props?.htmlLanguage ?? null,
            metaDescription: props?.metaDescription ?? null,
            metaKeywords: props?.metaKeywords ?? null,
            metaNoIndex: props?.metaNoIndex ?? null,
            enableOptimizelyAppInsightsScript: props?.enableOptimizelyAppInsightsScript ?? null,
            enableAppInsightsFiltering: props?.enableAppInsightsFiltering ?? null,
            appInsightsConnectionString: props?.appInsightsConnectionString ?? null,
            sEOScript: props?.sEOScript ?? null,
            canonicalUrl: props?.canonicalUrl ?? null,
        };

        return bodyData;
    }
}







