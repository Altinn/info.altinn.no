import type { IJSONTransformer } from "./IJSONTransformer";

export class Error404PageTransformer implements IJSONTransformer {
  public async Transform(cmsPageData: any): Promise<any> {
        /* C# logic (TS-ish++):
    return {
                    pageName: currentPage.PageName,
                    subHeading: currentPage.SubHeading,
                    mainBody: richTextAreaPropsBuilder.Build({ richTextArea: currentPage.MainBody, propertyName: "currentPage.MainBody" }),
                    image: imagePropsBuilder.Build(currentPage.Image, withOnPageEdit),
                }
    */
    return {
      componentName: "Error404Page",
      pageName: cmsPageData.name,
      ...cmsPageData.properties,
      isUserLoggedIn: false,
    };
  }
}
