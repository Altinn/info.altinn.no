import type { IJSONTransformer } from "../IJSONTransformer";

export class OperationalMessageArticlePageTransformer implements IJSONTransformer {
    public Transform(cmsPageData:any):any {
        /* C# logic (TS-ish++):
        const culture: CultureInfo.CurrentCulture.NormalizeCulture();
                    string linkurl: null;
                    string linktext: null;
        
                    if (currentPage.Link != null)
                    {
                        linkurl: urlResolver.GetUrl(currentPage.Link, culture.Name, { contextMode: ContextMode.Default });
        
                        if (contentLoader.TryGet<IContent>(currentPage.Link, out const linkedContent))
                        {
                            linktext: linkedContent.Name;
                        }
                    }
        
                    return {
                        pageName: currentPage.PageName,
                        colorVariant: !string.IsNullOrEmpty(currentPage.ColorVariant)
                            ? currentPage.colorVariant: currentPage.IsCritical ? "danger" : "warning",
                        mainBody: currentPage.MainBody,
                        mainBodyRichText: richTextAreaPropsBuilder.Build({
                            richTextArea: currentPage.MainBodyRichText,
                            propertyName: "currentPage.MainBodyRichText"
                        }),
                        linkUrl: linkUrl,
                        linkText: linkText,
                        ope: withOnPageEdit ? {} : null
                    }
        */
                const props = cmsPageData?.properties ?? {};
        let bodyData = {
            componentName: "OperationalMessageArticlePage",
            pageName: cmsPageData?.name ?? null,
            colorVariant: props?.colorVariant ?? null,
            mainBody: props?.mainBody ?? null,
            mainBodyRichText: props?.mainBodyRichText ?? null,
            linkUrl: props?.linkUrl ?? null,
            linkText: props?.linkText ?? null,
            ope: props?.ope ?? null,
        };

        return bodyData;
    }
}









