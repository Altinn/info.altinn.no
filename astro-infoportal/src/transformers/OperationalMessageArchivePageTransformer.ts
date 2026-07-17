import type { IJSONTransformer } from "./IJSONTransformer";
import { fetchUmbracoAncestors, fetchUmbracoChildren } from "@api/umbraco/client";
import { BreadcrumbsTransformer } from "./BreadcrumbsTransformer";
import { BlockTransformer } from "./BlockTransformer";
import { transformOperationalMessageArticle } from "./OperationalMessageArticlePageTransformer";
import type { Locale } from "@i18n/index";

export class OperationalMessageArchivePageTransformer implements IJSONTransformer {
  public async Transform(cmsPageData: any, globalData?: any): Promise<any> {
    const locale: Locale = globalData?.locale || "nb";
    const contentLocale: Locale = globalData?.contentLocale || locale;
    const props = cmsPageData.properties ?? {};
    const path = cmsPageData.route?.path;
    const isPreview = globalData?.isPreview;

    const [ancestors, children] = await Promise.all([
      path ? fetchUmbracoAncestors(path, contentLocale) : Promise.resolve([]),
      path ? fetchUmbracoChildren(path, 100, contentLocale, isPreview) : Promise.resolve([]),
    ]);

    const articles = children
      .filter((item: any) => item.contentType === "operationalMessageArticlePage")
      .sort((a: any, b: any) => {
        const aDate = new Date(a.updateDate ?? a.createDate ?? 0).getTime();
        const bDate = new Date(b.updateDate ?? b.createDate ?? 0).getTime();
        return bDate - aDate;
      })
      .map(transformOperationalMessageArticle);

    return {
      componentName: "OperationalMessageArchivePage",
      pageName: cmsPageData.name,
      breadcrumb: BreadcrumbsTransformer.Transform(ancestors, cmsPageData),
      articles,
      bottomContentArea: props.bottomContentArea
        ? BlockTransformer.TransformBlocks(props.bottomContentArea)
        : null,
    };
  }
}
