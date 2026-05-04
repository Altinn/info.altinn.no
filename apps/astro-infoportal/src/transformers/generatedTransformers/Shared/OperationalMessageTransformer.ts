import type { IJSONTransformer } from "../IJSONTransformer";

export class OperationalMessageTransformer implements IJSONTransformer {
    public Transform(cmsPageData:any):any {
        /* C# logic (TS-ish++):
        const culture: CultureInfo.CurrentCulture.NormalizeCulture();
                    const operationalmessage: parameters.OperationalMessageViewModel;
                    return {
                        pageName: operationalMessage.PageName,
                        message: operationalMessage.Message,
                        url: operationalMessage.Url,
                        urlText: localizationService.GetStringByCulture("/common/readmore", culture),
                        isCritical: operationalMessage.IsCritical,
                    }
        */
                const props = cmsPageData?.properties ?? {};
        let bodyData = {
            componentName: "OperationalMessage",
            pageName: cmsPageData?.name ?? null,
            message: props?.message ?? null,
            url: props?.url ?? null,
            urlText: props?.urlText ?? null,
            isCritical: props?.isCritical ?? null,
        };

        return bodyData;
    }
}







