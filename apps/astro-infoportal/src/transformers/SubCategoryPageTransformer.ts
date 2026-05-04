import type { IJSONTransformer } from "./IJSONTransformer";
import type { SubCategoryPageProps } from "@components/Pages/SubCategoryPage/SubCategoryPage.types";
import { fetchUmbracoAncestors, fetchUmbracoChildren, fetchUmbracoRelated } from "../api/umbraco/client";
import { BreadcrumbsTransformer } from "./BreadcrumbsTransformer";
import { BlockTransformer } from "./BlockTransformer";

export class SubCategoryPageTransformer implements IJSONTransformer {
  public async Transform(cmsPageData: any): Promise<any> {
    const props = cmsPageData.properties ?? {};

    const ancestors = await fetchUmbracoAncestors(cmsPageData.route.path);
    const breadcrumb = BreadcrumbsTransformer.Transform(ancestors, cmsPageData);

    const boxBlocks = props.boxBlocks
      ? BlockTransformer.TransformBlocks(props.boxBlocks)
      : undefined;
    const accordions = props.accordions
      ? BlockTransformer.TransformBlocks(props.accordions)
      : undefined;
    const promoArea = props.promoArea
      ? BlockTransformer.TransformBlocks(props.promoArea)
      : undefined;

    const related = await fetchUmbracoRelated("/skjemaoversikt", "schemaPage", "subCategory", cmsPageData.id);

    const schemas = related.map((s: any) => ({
          title: s.name,
          url: s.route?.path,
          componentName: "SchemaData"
        }));


    // Sidebar: "Alle tjenester" title, parent category as selected mainItem,
    // sibling subcategories as subItems with category prefix stripped.
    // path: /skjemaoversikt/kategori/{category}/{subcategory}/
    const segments = cmsPageData.route.path.split("/").filter(Boolean);
    const parentCategoryPath = segments.slice(0, 3).join("/"); // skjemaoversikt/kategori/{category}

    // Find parent category from ancestors
    const parentCategory = ancestors.find((a: any) => {
      const aPath = (a.route?.path || "").replace(/^\/|\/$/g, "");
      return aPath === parentCategoryPath;
    });

    // Strip parent category name prefix from subcategory names
    // e.g. "Tillatelser og kvalifikasjoner - A - Tillatelser for ..." → "A - Tillatelser for ..."
    const categoryPrefix = parentCategory?.name ? `${parentCategory.name} - ` : "";
    const stripPrefix = (name: string) =>
      categoryPrefix && name.startsWith(categoryPrefix)
        ? name.slice(categoryPrefix.length)
        : name;

    // Fetch sibling subcategories
    let subItems: any[] = [];
    if (parentCategory) {
      const siblings = await fetchUmbracoChildren(parentCategory.route.path);
      subItems = siblings
        .filter((s: any) => s.contentType === "subCategoryPage")
        .map((s: any) => ({
          label: stripPrefix(s.name),
          url: s.route?.path,
          current: s.id === cmsPageData.id,
        }))
        .sort((a: any, b: any) => a.label.localeCompare(b.label, "nb"));
    }

    const pageSidebarViewModel = {
      titleItem: {
        label: "Alle tjenester",
        url: "/skjemaoversikt",
        icon: "MenuGridIcon",
      },
      mainItems: [
        {
          label: parentCategory?.name || "Kategori",
          url: parentCategory?.route?.path,
          icon: parentCategory?.properties?.icon,
          current: false,
          subItems,
        },
      ],
    };

    return {
      componentName: "SubCategoryPage",
      pageName: cmsPageData.name,
      description: props.description || undefined,
      breadcrumb,
      schemas,
      boxBlocks,
      accordions,
      promoArea,
      timelineHeading: props.timelineHeading || undefined,
      timeline: props.timeline || [],
      pageSidebarViewModel,
    };
  }
}
