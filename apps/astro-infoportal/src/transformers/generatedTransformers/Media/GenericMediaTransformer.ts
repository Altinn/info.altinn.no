import type { IJSONTransformer } from "../IJSONTransformer";

export class GenericMediaTransformer implements IJSONTransformer {
    public Transform(cmsPageData:any):any {
        /* C# logic (TS-ish++):
        if (media: = null) return null;
        
                    const mediaurl: _urlResolver.GetUrl(media.ContentLink);
        
                    return {
                        src: mediaUrl,
                        name: media.Name,
                        description: media.Description,
                        ope: withOnPageEdit ? {} : null
                    }
        */
                const props = cmsPageData?.properties ?? {};
        let bodyData = {
            componentName: "GenericMedia",
            src: props?.src ?? null,
            name: props?.name ?? null,
            description: props?.description ?? null,
            ope: props?.ope ?? null,
        };

        return bodyData;
    }
}







