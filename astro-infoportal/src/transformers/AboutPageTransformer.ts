import type { IJSONTransformer } from "./IJSONTransformer";
import { resolveBlockReferences } from "../api/umbraco/client";
import { BlockTransformer } from "./BlockTransformer";

export class AboutPageTransformer implements IJSONTransformer {
  public async Transform(cmsPageData: any, globalData?: any): Promise<any> {
    const props = cmsPageData?.properties ?? {};

    const resolvedLinks = await resolveBlockReferences(props.linkArea, globalData?.locale);
    const linkArea = resolvedLinks.map((item: any) => ({
      text: item?.name,
      url: item?.route?.path,
      preamble: item?.properties?.mainIntro,
    }));

    const contactArea = props.contactArea
      ? BlockTransformer.TransformBlocks(props.contactArea)
      : undefined;

    return {
      componentName: "AboutPage",
      pageName: cmsPageData?.name,
      linkArea,
      contactArea,
      isUserLoggedIn: false,
    };
  }
}
