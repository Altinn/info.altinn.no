import type { IJSONTransformer } from "./IJSONTransformer";
import { fetchUmbracoAncestors, fetchUmbracoChildren, fetchUmbracoContent } from "../api/umbraco/client";
import { BlockTransformer } from "./BlockTransformer";
import { BreadcrumbsTransformer } from "./BreadcrumbsTransformer";
import type { Locale } from "@i18n/index";

const articleContentTypes = new Set([
  "articlePage",
  "sectionArticlePage",
  "helpDrilldownPage",
  "aboutPage",
  "subsidyPage",
  "schemaPage",
]);

export class ThemePageTransformer implements IJSONTransformer {
  public async Transform(cmsPageData: any, globalData?: any): Promise<any> {
    const props = cmsPageData.properties ?? {};
    const locale: Locale = globalData?.locale || "nb";

    const ancestors = await fetchUmbracoAncestors(cmsPageData.route.path, locale);
    const breadcrumb = BreadcrumbsTransformer.Transform(ancestors, cmsPageData);

    const allChildren = await fetchUmbracoChildren(cmsPageData.route.path, 100, locale);
    const children = allChildren.filter(
      (c: any) => c.properties?.showInNavigation !== false,
    );

    const themeGroups = await Promise.all(
      children.map(async (child: any) => {
        const isArticle = articleContentTypes.has(child.contentType);
        let intro = child.properties?.mainIntro ?? null;
        let childPages: any[] = [];

        if (isArticle && !intro && child.route?.path) {
          try {
            const fullArticle = await fetchUmbracoContent(child.route.path, locale);
            intro = fullArticle.properties?.mainIntro ?? null;
          } catch {
            intro = null;
          }
        }

        if (!isArticle) {
          const allChildPages = await fetchUmbracoChildren(child.route.path, 100, locale);
          childPages = allChildPages.filter(
            (c: any) => c.properties?.showInNavigation !== false,
          );
        }

        const mappedChildPages = childPages.map((sub: any) => ({
          componentName: "LinkItem",
          text: sub.name,
          url: sub.route?.path,
        }));

        return {
          type: isArticle ? "article" : "container",
          title: child.name,
          intro: isArticle ? intro : null,
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
