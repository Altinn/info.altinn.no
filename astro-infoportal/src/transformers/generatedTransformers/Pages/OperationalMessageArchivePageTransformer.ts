import type { IJSONTransformer } from "../IJSONTransformer";

export class OperationalMessageArchivePageTransformer implements IJSONTransformer {
    public Transform(cmsPageData:any):any {
        /* C# logic (TS-ish++):
        const children: currentPage.ContentLink.GetChildren<OperationalMessageArticlePage>()
                        .FilterForDisplay();
        
                    const oslotimeZone: TimeZoneInfo.FindSystemTimeZoneById("Central European Standard Time");
        
                    const articles: children.map(item: >
                    {
                        const publishdate: item.StartPublish;
                        const localpublishDate: publishDate.HasValue
                            ? TimeZoneInfo.ConvertTime(publishDate.Value, osloTimeZone)
                            : (DateTime?)null;
        
                        return {
                            pageName: item.PageName,
                            mainBody: item.MainBody,
                            mainBodyRichText: richTextAreaPropsBuilder.Build({
                                richTextArea: item.MainBodyRichText,
                                propertyName: "item.MainBodyRichText"
                            }),
                            colorVariant: !string.IsNullOrEmpty(item.ColorVariant)
                                ? item.colorVariant: item.IsCritical ? "danger" : "warning",
                            url: urlResolver.GetUrl(item.ContentLink),
                            lastChangedDateString: localPublishDate?.ToString("o"),
                            lastChangedDateFormatted: localPublishDate?.ToFormattedDateWithTime(CultureInfo.CurrentCulture)
                        };
                    });
        
                    return {
                        pageName: currentPage.PageName,
                        breadcrumb: breadcrumbViewModelBuilder.Build({ currentPage: currentPage }),
                        articles: articles,
                        bottomContentArea: contentAreaPropsBuilder.Build({ contentArea: currentPage.BottomContentArea, propertyName: "currentPage.BottomContentArea" })
                    }
        */
                const props = cmsPageData?.properties ?? {};
        let bodyData = {
            componentName: "OperationalMessageArchivePage",
            pageName: cmsPageData?.name ?? null,
            mainBody: props?.mainBody ?? null,
            mainBodyRichText: props?.mainBodyRichText ?? null,
            colorVariant: props?.colorVariant ?? null,
            url: props?.url ?? null,
            lastChangedDateString: props?.lastChangedDateString ?? null,
            lastChangedDateFormatted: props?.lastChangedDateFormatted ?? null,
        };

        return bodyData;
    }
}









