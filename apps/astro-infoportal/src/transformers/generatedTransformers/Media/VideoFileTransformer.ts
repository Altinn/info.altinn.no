import type { IJSONTransformer } from "../IJSONTransformer";

export class VideoFileTransformer implements IJSONTransformer {
    public Transform(cmsPageData:any):any {
        /* C# logic (TS-ish++):
        if (videofile: = null) return null;
        
                    const videourl: _urlResolver.GetUrl(videoFile.ContentLink);
        
                    return {
                        src: videoUrl,
                        copyright: videoFile.Copyright,
                        previewImage: _imagePropsBuilder.Build(videoFile.PreviewImage, withOnPageEdit),
                        ope: withOnPageEdit ? {} : null
                    }
        */
                const props = cmsPageData?.properties ?? {};
        let bodyData = {
            componentName: "VideoFile",
            src: props?.src ?? null,
            copyright: props?.copyright ?? null,
            previewImage: props?.previewImage ?? null,
            ope: props?.ope ?? null,
        };

        return bodyData;
    }
}







