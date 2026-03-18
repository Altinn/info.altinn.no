import type { IJSONTransformer } from "./IJSONTransformer";
import { fetchUmbracoChildren } from "../api/umbraco/client";
import { BlockTransformer } from "./BlockTransformer";

const articleContentTypes = new Set([
  "helpDrilldownPage",
  "aboutPage",
  "subsidyPage",
  "schemaPage",
]);

export class ThemePageTransformer implements IJSONTransformer {
  public async Transform(cmsPageData: any): Promise<any> {
    const props = cmsPageData.properties ?? {};

    const allChildren = await fetchUmbracoChildren(cmsPageData.id);
    const children = allChildren.filter(
      (c: any) => c.properties?.showInNavigation !== false,
    );

    const themeGroups = await Promise.all(
      children.map(async (child: any) => {
        const allChildPages = await fetchUmbracoChildren(child.id);
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
      themeGroups,
      bottomContentArea,
    };
  }
}
