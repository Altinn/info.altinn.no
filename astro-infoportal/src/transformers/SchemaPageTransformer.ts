import type { IJSONTransformer } from "./IJSONTransformer";
import type { SchemaPageProps } from "@components/Pages/SchemaPage/SchemaPage.types";

export class SchemaPageTransformer implements IJSONTransformer {
  public async Transform(cmsPageData: any): Promise<SchemaPageProps> {
    return {
      componentName: "SchemaPage",
      schemaCategory: cmsPageData.properties.schemaCategory || undefined,
      schemaPageNameText: cmsPageData.properties.schemaPageNameText || undefined,
      schemaCode: cmsPageData.properties.schemaCode || undefined,
      attachmentText: cmsPageData.properties.attachmentText || undefined,
      attachments: cmsPageData.properties.attachments || [],
      schemaFromProviderText: cmsPageData.properties.schemaFromProviderText || undefined,
      providerPages: cmsPageData.properties.providerPages || [],
      promoArea: cmsPageData.properties.promoArea || undefined,
      areThereMunicipalities: cmsPageData.properties.areThereMunicipalities || false,
      areThereCounties: cmsPageData.properties.areThereCounties || false,
      subHeading: cmsPageData.properties.subHeading || undefined,
      deadline: cmsPageData.properties.deadline || undefined,
      deadlineText: cmsPageData.properties.deadlineText || undefined,
      ...cmsPageData.properties,
    };
  }
}
