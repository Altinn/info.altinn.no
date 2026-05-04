import type { IJSONTransformer } from "../IJSONTransformer";

export class LinkItemTransformer implements IJSONTransformer {
    public Transform(cmsPageData:any):any {
        /* C# logic (TS-ish++):
        if (link: = null)
                        return null;
        
                    string url: null;
                    if (link.Href != null && !string.IsNullOrWhiteSpace(link.Href.ToString()))
                    {
                        try
                        {
                            url: urlResolver.GetUrl(link.Href);
                        }
                        catch
                        {
                            // If URL resolution fails, leave it as null
                            url: null;
                        }
                    }
        
                    return {
                        text: link.Text,
                        url: url,
                    }
        */
                const props = cmsPageData?.properties ?? {};
        let bodyData = {
            componentName: "LinkItem",
            text: props?.text ?? null,
            url: props?.url ?? null,
        };

        return bodyData;
    }
}







