import type { IJSONTransformer } from "../IJSONTransformer";

export class TimelineItemBlockTransformer implements IJSONTransformer {
    public Transform(cmsPageData:any):any {
        /* C# logic (TS-ish++):
        return {
                        heading: block.Heading,
                        subHeading: block.SubHeading,
                        content: contentAreaPropsBuilder.Build(
                            {
                                contentArea: block.Content,
                                propertyName: "TimelineItemBlock.Content"
                            },
                            withOnPageEdit
                        ),
                    }
        */
                const props = cmsPageData?.properties ?? {};
        let bodyData = {
            componentName: "TimelineItemBlock",
            heading: props?.heading ?? null,
            subHeading: props?.subHeading ?? null,
            content: props?.content ?? null,
        };

        return bodyData;
    }
}







