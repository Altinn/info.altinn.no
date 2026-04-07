import type { IJSONTransformer } from "./IJSONTransformer";
import { fetchUmbracoAncestors, fetchUmbracoChildren } from "../api/umbraco/client";
import { BlockTransformer } from "./BlockTransformer";
import { BreadcrumbsTransformer } from "./BreadcrumbsTransformer";

const articleContentTypes = new Set([
  "helpDrilldownPage",
  "aboutPage",
  "subsidyPage",
  "schemaPage",
]);

export class ThemePageTransformer implements IJSONTransformer {
  public async Transform(cmsPageData: any): Promise<any> {
    const props = cmsPageData.properties ?? {};

    const ancestors = await fetchUmbracoAncestors(cmsPageData.route.path);
    const breadcrumb = BreadcrumbsTransformer.Transform(ancestors, cmsPageData);

    const allChildren = await fetchUmbracoChildren(cmsPageData.route.path);
    const children = allChildren.filter(
      (c: any) => c.properties?.showInNavigation !== false,
    );

    const themeGroups = await Promise.all(
      children.map(async (child: any) => {
        const allChildPages = await fetchUmbracoChildren(child.route.path);
        const childPages = allChildPages.filter(
          (c: any) => c.properties?.showInNavigation !== false,
        );

        const mappedChildPages = childPages.map((sub: any) => ({
          componentName: "LinkItem",
          text: sub.name,
          url: sub.route?.path,
        }));

        const isArticle = articleContentTypes.has(child.contentType);

        return {
          type: isArticle ? "article" : "container",
          title: child.name,
          intro: isArticle ? (child.properties?.mainIntro ?? null) : null,
          url: isArticle ? (child.route?.path ?? null) : null,
          childPages: mappedChildPages,
        };
      }),
    );

    const bottomContentArea = props.bottomContentArea
      ? BlockTransformer.TransformBlocks(props.bottomContentArea)
      : undefined;

    return {
      componentName: "ThemePage",
      pageName: cmsPageData.name,
      mainIntro: props.mainIntro,
      breadcrumb: breadcrumb,
      themeGroups,
      bottomContentArea,
    };
  }
}
