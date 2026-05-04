import type { IJSONTransformer } from "./IJSONTransformer";

export class PromoBoxBlockTransformer implements IJSONTransformer {
  public async Transform(cmsPageData: any): Promise<any> {
    const p = cmsPageData.properties ?? {};

    const linkRaw = p.link;
    const link = linkRaw
      ? {
          url: linkRaw.url ?? linkRaw.route?.path ?? "",
          text: linkRaw.text ?? linkRaw.name ?? "",
        }
      : undefined;

    // text: pass through as-is so the component can extract links from items[].html
    const text = p.text ?? undefined;

    const imageRaw = p.image;
    const image = imageRaw
      ? {
          src: imageRaw.url ?? imageRaw[0]?.url ?? "",
          alt: p.imageAltText ?? "",
        }
      : undefined;

    return {
      componentName: "PromoBoxBlock",
      link,
      text,
      image,
    };
  }
}
