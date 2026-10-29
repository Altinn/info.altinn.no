import type { ContactPageProps } from "@components/Pages/ContactPage/ContactPage.types";
import type { IJSONTransformer } from "./IJSONTransformer";

export class ContactPageTransformer implements IJSONTransformer {
  public async Transform(
    cmsPageData: any,
  ): Promise<ContactPageProps & { componentName: string }> {
    return {
      componentName: "ContactPage",
      ...cmsPageData.properties,
    };
  }
}
