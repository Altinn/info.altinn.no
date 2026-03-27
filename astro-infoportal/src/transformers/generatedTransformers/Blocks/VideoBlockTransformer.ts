import type { IJSONTransformer } from "../IJSONTransformer";

export class VideoBlockTransformer implements IJSONTransformer {
    public Transform(cmsPageData:any):any {
        /* C# logic (TS-ish++):
        if (block: = null) return null;
        
                    const viewmodel: {
                        videoType: (int)block.VideoType,
                        url: GetUrl(block),
                        ope: withOnPageEdit ? {} : null
                    };
        
                    return viewModel
        */
                const props = cmsPageData?.properties ?? {};
        let bodyData = {
            componentName: "VideoBlock",
            placeholder: null,
        };

        return bodyData;
    }
}







