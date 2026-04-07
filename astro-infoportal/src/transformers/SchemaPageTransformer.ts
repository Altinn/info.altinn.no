import type { IJSONTransformer } from "./IJSONTransformer";
import type { SchemaPageProps } from "@components/Pages/SchemaPage/SchemaPage.types";

export class SchemaPageTransformer implements IJSONTransformer {
  public async Transform(cmsPageData: any): Promise<SchemaPageProps> {
    const props = cmsPageData.properties ?? {};    

    const accordianList = {};
    accordianList["items"]  = props.accordianList.map((item: any) => ({
          translatedHeading: item.name,
          description: item.description,
          componentName: "SchemaAccordianBlock"
        }));

    const mainBody = {};    
    
    mainBody["items"]  = props.mainIntro.items.map((item: any) => ({
          translatedHeading: item.name,
          html: item.html,
          componentName: "RichText"
        }));

    return {
      componentName: "SchemaPage",
      //schemaCategory: cmsPageData.properties.schemaCategory || undefined,
      schemaPageNameText: cmsPageData.name,
      schemaCode: props.schemaCode,
      //attachmentText: cmsPageData.properties.attachmentText || undefined,
      //attachments: cmsPageData.properties.attachments || [],
      //schemaFromProviderText: cmsPageData.properties.schemaFromProviderText || undefined,
      orangeMessage: props.orangeMessage,
      providerPages: cmsPageData.properties.providerPages || [],
      promoArea: cmsPageData.properties.promoArea || undefined,
      areThereMunicipalities: cmsPageData.properties.areThereMunicipalities || false,
      areThereCounties: cmsPageData.properties.areThereCounties || false,
      accordianList: accordianList,
      mainBody: mainBody,
      //subHeading: cmsPageData.properties.subHeading || undefined,
      deadline: cmsPageData.properties.deadline || undefined,
      deadlineText: cmsPageData.properties.deadlineText || undefined
    };
  }
}
