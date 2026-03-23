import type { IJSONTransformer } from "./IJSONTransformer";
import { fetchUmbracoChildren } from "../api/umbraco/client";

export class NewsArchivePageTransformer implements IJSONTransformer {
  public async Transform(cmsPageData: any): Promise<any> {
    const children = await fetchUmbracoChildren(cmsPageData.id);
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
      newsArticles: newsArticles
    };
  }
}
