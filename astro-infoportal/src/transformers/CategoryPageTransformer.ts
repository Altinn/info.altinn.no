import { type Locale, t } from "@i18n/index";
import {
  fetchUmbracoAncestors,
  fetchUmbracoChildren,
  fetchUmbracoContentCount,
} from "../api/umbraco/client";
import { BreadcrumbsTransformer } from "./BreadcrumbsTransformer";
import { stripCategoryPrefix } from "./categoryPrefix";
import type { IJSONTransformer } from "./IJSONTransformer";

/**
 * Number of schemas filed under a subcategory.
 *
 * Counted in bokmål on purpose: SubCategoryPageTransformer lists the
 * subcategory's schemas from the NB tree in every locale, so an NN/EN count
 * would advertise fewer services than the page it links to actually shows.
 */
async function fetchSchemaCount(subCategoryId: string): Promise<number> {
  try {
    return await fetchUmbracoContentCount(
      ["contentType:schemaPage", `subCategory:${subCategoryId}`],
      "nb",
    );
  } catch {
    // Count is decoration — render the subcategory without a badge instead
    // of failing the whole page.
    return 0;
  }
}

/** "11 tjenester" / "1 service" — empty subcategories get no badge at all. */
function schemaCountText(count: number, locale: Locale): string | undefined {
  if (!count) return undefined;
  const key =
    count === 1 ? "category.schemaCount.one" : "category.schemaCount.other";
  return t(key, locale).replace("{0}", String(count));
}

export class CategoryPageTransformer implements IJSONTransformer {
  public async Transform(cmsPageData: any, globalData?: any): Promise<any> {
    const props = cmsPageData.properties ?? {};
    const locale: Locale = globalData?.locale ?? "nb";
    const contentLocale: Locale = globalData?.contentLocale ?? locale;

    const ancestors = await fetchUmbracoAncestors(
      cmsPageData.id,
      contentLocale,
    );
    const breadcrumb = BreadcrumbsTransformer.Transform(ancestors, cmsPageData);

    // Subcategories: direct children of this category page, kept in the order
    // the editors arranged them in Umbraco.
    const children = await fetchUmbracoChildren(
      cmsPageData.route.path,
      100,
      contentLocale,
    );
    const subCategories = await Promise.all(
      children
        .filter((c: any) => c.contentType === "subCategoryPage")
        .map(async (c: any) => {
          const count = await fetchSchemaCount(c.id);
          return {
            heading: stripCategoryPrefix(c.name),
            url: c.route?.path,
            schemaCountText: schemaCountText(count, locale),
          };
        }),
    );

    // Sidebar: all sibling categories
    const segments = cmsPageData.route.path.split("/").filter(Boolean);
    segments.pop(); // remove current category slug → "skjemaoversikt/kategori"
    const parentPath = segments.join("/");
    const allCategories = await fetchUmbracoChildren(
      parentPath,
      100,
      contentLocale,
    );

    const pageSidebarViewModel = {
      titleItem: {
        label: t("schemaOverview.allServices", locale),
        url: "/skjemaoversikt",
        icon: "MenuGridIcon",
      },
      mainItems: allCategories
        .filter((c: any) => c.contentType === "categoryPage")
        .map((c: any) => ({
          label: c.name,
          url: c.route?.path,
          icon: c.properties?.icon,
          current: c.id === cmsPageData.id,
        })),
    };

    return {
      componentName: "CategoryPage",
      pageName: cmsPageData.name,
      mainIntro: props.mainIntro || undefined,
      breadcrumb,
      subCategories,
      pageSidebarViewModel,
    };
  }
}
