import type { IJSONTransformer } from "../IJSONTransformer";

export class VectorImageFileTransformer implements IJSONTransformer {
    public Transform(cmsPageData:any):any {
        /* C# logic (TS-ish++):
        if (vectorimageFile: = null)
                    {
                        return null;
                    }
        
                    const imageurl: _urlResolver.GetUrl(vectorImageFile.ContentLink);
        
                    const viewmodel: {
                        src: imageUrl,
                        altText: vectorImageFile.Name,
                        backgroundColor: vectorImageFile.HexBackGroundColor,
                        ope: withOnPageEdit ? {} : null
                    };
        
                    return viewModel
        */
                const props = cmsPageData?.properties ?? {};
        let bodyData = {
            componentName: "VectorImageFile",
            src: props?.src ?? null,
            altText: props?.altText ?? null,
            backgroundColor: props?.backgroundColor ?? null,
            ope: props?.ope ?? null,
        };

        return bodyData;
    }
}







