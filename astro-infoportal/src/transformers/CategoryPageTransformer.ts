import type { IJSONTransformer } from "./IJSONTransformer";

export class CategoryPageTransformer implements IJSONTransformer {
  public async Transform(cmsPageData: any): Promise<any> {

        /* C# logic (TS-ish++):
    const culture: CultureInfo.CurrentCulture.NormalizeCulture();
                const currentcategoryId: currentPage.PageLink.ID;
                const categories: schemaRelationsService.GetCategory(culture.Name);
                const currentcategory: categories.FirstOrDefault(x: > x.id: = currentCategoryId);
    
                return {
                    pageName: currentPage.PageName,
                    mainIntro: richTextAreaPropsBuilder.Build({
                        richTextArea: currentPage.MainIntro,
                        propertyName: "currentPage.MainIntro"
                    }),
                    icon: currentPage.Icon,
                    breadcrumb: breadcrumbViewModelBuilder.Build({ currentPage: currentPage }),
                    subCategories: currentCategory?.SubCategories.map(x: > MapSubCategoryToViewModel(x, culture.Name)),
                    ope: withOnPageEdit ? {} : null
                }
    */
   
    return {
      componentName: "CategoryPage",
      pageName: cmsPageData.name,
      ...cmsPageData.properties,
      isUserLoggedIn: false,
    };
  }
}
