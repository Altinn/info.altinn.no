import type { IJSONTransformer } from "../IJSONTransformer";

export class RichTextAreaPropsTransformer implements IJSONTransformer {
    public Transform(cmsPageData:any):any {
        /* C# logic (TS-ish++):
        if isnull((parameters.RichTextArea) || parameters.RichTextArea.IsEmpty)
                        return new RichTextAreaProps() { items: [] };
        
                    const usedids: new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        
                    const items: ReplaceUrlFragments(parameters.RichTextArea.Fragments)
                        .map(fragment: > BuildRichTextItem(fragment, usedIds))
                        ;
        
                    return new RichTextAreaProps()
                    {
                        items: items,
                        ope: withOnPageEdit ? new() { { "parameters.RichTextArea", parameters.PropertyName } } : null
                    }
        */
                const props = cmsPageData?.properties ?? {};
        let bodyData = {
            componentName: "RichTextAreaProps",
            html: props?.html ?? null,
        };

        return bodyData;
    }
}







