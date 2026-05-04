import type { IJSONTransformer } from "../IJSONTransformer";
import { fetchUmbracoAncestors, fetchUmbracoChildren } from "../../../api/umbraco/client";
import { BreadcrumbsTransformer } from "../BreadcrumbsTransformer";

export class NewsArchivePageTransformer implements IJSONTransformer {
  public async Transform(cmsPageData: any): Promise<any> {
    /* C# logic (TS-ish++):
    const culture: CultureInfo.CurrentCulture.NormalizeCulture();
    
                const httpcontext: httpContextAccessor.HttpContext;
                const pagenumberString: httpContext?.Request.Query[QueryParamPageNumber].ToString();
                const currentpageNumber: int.TryParse(pageNumberString, out const p) && p > 0 ? p : 1;
    
                const allnewsArticles: contentLoader.GetChildren<NewsArticlePage>(currentPage.ContentLink, culture)
                    .FilterForDisplay()
                    .OrderByDescending(x: > x.StartPublish)
                    ;
    
                const totalcount: allNewsArticles.Count;
                const totalpages: (int)Math.Ceiling((double)totalCount / PageSize);
    
                // Apply pagination
                const paginatednewsArticles: allNewsArticles
                    .Skip((currentPageNumber - 1) * PageSize)
                    .Take(PageSize)
                    .map(article: > newsArticleItemViewModelBuilder.Build(article))
                    ;
    
                return {
                    pageName: currentPage.PageName,
                    newsArticles: paginatedNewsArticles,
                    totalResultCount: totalCount,
                    totalPages: totalPages,
                    currentPageNumber: currentPageNumber,
                    lastPageText: localizationService.GetStringByCulture("/search/lastpage", culture),
                    nextPageText: localizationService.GetStringByCulture("/search/nextpage", culture),
                    bottomContentArea: contentAreaPropsBuilder.Build({
                        contentArea: currentPage.BottomContentArea,
                        propertyName: "currentPage.BottomContentArea"
                    }),
                    breadcrumb: breadcrumbViewModelBuilder.Build({ currentPage: currentPage }),
                    ope: withOnPageEdit ? {} : null
                }
    */
        const children = await fetchUmbracoChildren(cmsPageData.id);
 
    const ancestors = await fetchUmbracoAncestors(cmsPageData.id);
    const breadcrumb = BreadcrumbsTransformer.Transform(ancestors, cmsPageData);

    const newsArticles = 
      children.map((child: any) => {
        return {
            pageName: child.name,
            mainIntro: child.properties.mainIntro,
            url: child.route.path,
            lastChanged: null,
            componentName: "NewsArticleItem"
        };
      });

    return {
      componentName: "NewsArchivePage",
      pageName: cmsPageData.name,
      newsArticles: newsArticles,
      breadcrumb: breadcrumb,
    };
  }
}









