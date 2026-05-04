import type { IJSONTransformer } from "../IJSONTransformer";

export class ImagePropsTransformer implements IJSONTransformer {
    public Transform(cmsPageData:any):any {
        /* C# logic (TS-ish++):
        if (contentreference: = null || ContentReference.IsNullOrEmpty(contentReference))
                    return null;
        
                try
                {
                    // Load as IContent first to handle both ImageFile and VectorImageFile
                    const content: contentLoader.Get<IContent>(contentReference);
        
                    if isImageFile((content) imageFile)
                    {
                        return BuildImageFromImageFile(imageFile);
                    }
                    else if isVectorImageFile((content) vectorImageFile)
                    {
                        return BuildImageFromVectorImageFile(vectorImageFile);
                    }
                    else if isMediaData((content) mediaData)
                    {
                        // Fallback for any other media type
                        return {
                            src: urlResolver.GetUrl(contentReference)
                        };
                    }
                }
                catch
                {
                    // If loading fails, return null
                    return null;
                }
        
                return null
        */
                const props = cmsPageData?.properties ?? {};
        let bodyData = {
            componentName: "ImageProps",
            src: props?.src ?? null,
        };

        return bodyData;
    }
}







