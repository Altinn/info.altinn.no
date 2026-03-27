import type { IJSONTransformer } from "../IJSONTransformer";

export class ImageFileTransformer implements IJSONTransformer {
    public Transform(cmsPageData:any):any {
        /* C# logic (TS-ish++):
        if (imagefile: = null) return null;
        
                    const imageurl: _urlResolver.GetUrl(imageFile.ContentLink);
        
                    return {
                        src: imageUrl,
                        altText: imageFile.Name,
                        ope: withOnPageEdit ? {} : null
                    }
        */
                const props = cmsPageData?.properties ?? {};
        let bodyData = {
            componentName: "ImageFile",
            src: props?.src ?? null,
            altText: props?.altText ?? null,
            ope: props?.ope ?? null,
        };

        return bodyData;
    }
}







