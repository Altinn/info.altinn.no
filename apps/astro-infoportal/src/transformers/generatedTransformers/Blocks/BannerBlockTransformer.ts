import type { IJSONTransformer } from "../IJSONTransformer";

export class BannerBlockTransformer implements IJSONTransformer {
    public Transform(cmsPageData:any):any {
        /* C# logic (TS-ish++):
        const culture: CultureInfo.CurrentCulture.NormalizeCulture();
        
                    const closebuttonText: localizationService.GetStringByCulture(
                        "/banner/close",
                        culture) ?? "";
        
                    const messageprops: richTextAreaPropsBuilder.Build(
                        {
                            richTextArea: block.Message,
                            propertyName: "block.Message"
                        });
        
                    // Generate content hash from message and badge text
                    // When content changes, hash changes, so banner shows again
                    const contentforHash: `{block.Message?.ToHtmlString() ?? `"}{block.BadgeText ?? ""}";
                    const contenthash: GenerateContentHash(contentForHash);
        
                    return {
                        ope: withOnPageEdit ? {} : null,
                        fullRefreshProperties: withOnPageEdit
                            ? ["block.Message"]
                            : null,
                        message: messageProps,
                        isActive: block.IsActive,
                        badgeText: block.BadgeText ?? "",
                        colorTheme: block.ColorTheme?.ToLowerInvariant() ?? "accent",
                        closeButtonText: closeButtonText,
                        contentHash: contentHash,
                        localStoragePrefix: LocalStorageKeyPrefix
                    }
        */
                const props = cmsPageData?.properties ?? {};
        let bodyData = {
            componentName: "BannerBlock",
            ope: props?.ope ?? null,
            fullRefreshProperties: props?.fullRefreshProperties ?? null,
            message: props?.message ?? null,
            isActive: props?.isActive ?? null,
            badgeText: props?.badgeText ?? null,
            colorTheme: props?.colorTheme ?? null,
            closeButtonText: props?.closeButtonText ?? null,
            contentHash: props?.contentHash ?? null,
            localStoragePrefix: props?.localStoragePrefix ?? null,
        };

        return bodyData;
    }
}







