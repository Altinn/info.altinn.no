import type { IJSONTransformer } from "./IJSONTransformer";

export class DoYouNeedHelpBlockTransformer implements IJSONTransformer {
  public async Transform(cmsPageData: any): Promise<any> {
    const p = cmsPageData.properties ?? {};
    return {
      componentName: "DoYouNeedHelpBlock",
      heading: p.heading ?? undefined,
      image: p.image ?? undefined,
      imageAltText: p.imageAltText ?? undefined,
      description: p.description ?? undefined,
      phoneNumber: p.phoneNumber ?? undefined,
      emailLinkText: p.emailLinkText ?? undefined,
      email: p.email ?? undefined,
      showContactFormButton: p.showContactFormButton ?? false,
      contactFormText: p.contactFormText ?? undefined,
      labels: p.labels ?? undefined,
      contactFormSchemaId: p.contactFormSchemaId ?? 0,
      showAttachment: p.showAttachment ?? false,
      useRecaptcha: p.useRecaptcha ?? false,
      recaptchaSiteKey: p.recaptchaSiteKey ?? undefined,
      contactFormPageData: p.contactFormPageData ?? undefined,
    };
  }
}
