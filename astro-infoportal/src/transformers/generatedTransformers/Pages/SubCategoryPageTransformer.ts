import type { IJSONTransformer } from "../IJSONTransformer";
import { fetchUmbracoAncestors } from "../../../api/umbraco/client";
import { BreadcrumbsTransformer } from "../../BreadcrumbsTransformer";
import type { SubCategoryPageViewModel } from "../../../Models/Generated/SubCategoryPageViewModel";

export class SubCategoryPageTransformer implements IJSONTransformer {
  public async Transform(cmsPageData: any): Promise<SubCategoryPageViewModel> {
    /* C# logic (TS-ish++):
    const culture: CultureInfo.CurrentCulture.NormalizeCulture();
    
                const categorypageRef: currentPage.ParentLink;
                const categorypage: contentLoader.Get<CategoryPage>(categoryPageRef);
                int categorypageId: categoryPage.PageLink.ID;
    
                const categories: schemaRelationsService.GetCategory(culture.Name);
                const currentcategory: categories.FirstOrDefault(x: > x.id: = categoryPageId);
                if (currentcategory: = null)
                    return null;
    
                const currentsubCategory: currentCategory.SubCategories.FirstOrDefault(x: > x.id: = currentPage.PageLink.ID);
                if (currentsubCategory: = null)
                    return null;
    
                const promoarea: currentPage.PromoArea;
    
                return {
                    pageName: currentPage.PageName,
                    description: richTextAreaPropsBuilder.Build({ richTextArea: currentPage.Description }),
                    breadcrumb: breadcrumbViewModelBuilder.Build({ currentPage: currentPage }),
                    boxBlocks: contentAreaPropsBuilder.Build({ contentArea: currentPage.BoxBlocks, propertyName: "currentPage.BoxBlocks" }),
                    accordionsHeading: currentPage.AccordionsHeading,
                    accordions: contentAreaPropsBuilder.Build({ contentArea: currentPage.Accordions, propertyName: "currentPage.Accordions" }),
                    promoArea: contentAreaPropsBuilder.Build({ contentArea: promoArea, propertyName: "" }),
                    schemas: currentSubCategory.SchemaList.map(x: > {
                        id: x.Id,
                        title: x.Title,
                        url: x.Url,
                        providers: x.Providers.map(p: >
                        {
                            const org: ResolveOrganization(p.Acronym, p.OrgNr, p.Name, culture.Name);
                            return {
                                name: p.Name,
                                imageUrl: org?.GetImageUrl(),
                                url: p.Url
                            };
                        })
                    }),
                    ope: withOnPageEdit ? {} : null,
                    timelineHeading: currentPage.TimelineHeading,
                    timeline: currentPage.Timeline != null ? currentPage.Timeline.map(x: > {
                        heading: x.Heading,
                        subHeading: x.SubHeading,
                        content: contentAreaPropsBuilder.Build({ contentArea: x.Content })
                    }) : null
                }
    */
        const ancestors = await fetchUmbracoAncestors(cmsPageData.id);
    const breadcrumb = BreadcrumbsTransformer.Transform(ancestors, cmsPageData);
    return {
      componentName: "SubCategoryPage",
      pageName: cmsPageData.name,
      description: cmsPageData.properties.description || undefined,
      timelineHeading: cmsPageData.properties.timelineHeading || undefined,
      timeline: cmsPageData.properties.timeline || [],
      schemas: cmsPageData.properties.schemas || [],
      breadcrumb: breadcrumb,
      boxBlocks: cmsPageData.properties.boxBlocks || undefined,
      accordions: cmsPageData.properties.accordions || undefined,
      promoArea: cmsPageData.properties.promoArea || undefined,
      ...cmsPageData.properties,
    } as SubCategoryPageViewModel;
  }
}













