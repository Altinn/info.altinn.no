import type { IJSONTransformer } from "./IJSONTransformer";

export class LinkButtonBlockTransformer implements IJSONTransformer {
  public async Transform(cmsPageData: any): Promise<any> {
    const p = cmsPageData.properties ?? {};

    const linkRaw = p.link ?? {};
    const link = {
      url: linkRaw.url ?? linkRaw.route?.path ?? "",
      text: linkRaw.text ?? linkRaw.name ?? "",
    };

    return {
      componentName: "LinkButtonBlock",
      link,
      icon: p.icon ?? undefined,
      buttonType: p.buttonType ?? "Default",
    };
  }
}
