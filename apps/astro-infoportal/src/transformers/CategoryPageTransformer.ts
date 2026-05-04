import type { IJSONTransformer } from "./IJSONTransformer";
import { fetchUmbracoAncestors, fetchUmbracoChildren } from "../api/umbraco/client";
import { BreadcrumbsTransformer } from "./BreadcrumbsTransformer";

/** Normalize URL slugs: strip trailing slashes and collapse multiple dashes to single. */
function normalizeUrl(url: string): string {
  return url.replace(/\/+$/, "").replace(/-{2,}/g, "-");
}

/** Fetch schema count text per subcategory URL from the production overview page. */
async function fetchSchemaCountsByUrl(): Promise<Record<string, string>> {
  const map: Record<string, string> = {};
  try {
    const res = await fetch("https://info.altinn.no/skjemaoversikt/");
    const html = await res.text();
    const m = html.match(/"schemaCategories":(\[.*?\])\s*,\s*"providerCollections"/s);
    if (!m) return map;
    const categories = JSON.parse(m[1]) as {
      subCategories?: { url?: string; schemaCountText?: string }[];
    }[];
    for (const cat of categories) {
      for (const sub of cat.subCategories ?? []) {
        if (sub.url && sub.schemaCountText) {
          map[normalizeUrl(sub.url)] = sub.schemaCountText;
        }
      }
    }
  } catch {
    // If production fetch fails, counts will be empty
  }
  return map;
}

export class CategoryPageTransformer implements IJSONTransformer {
  public async Transform(cmsPageData: any): Promise<any> {
    const props = cmsPageData.properties ?? {};

    const ancestors = await fetchUmbracoAncestors(cmsPageData.route.path);
    const breadcrumb = BreadcrumbsTransformer.Transform(ancestors, cmsPageData);

    // Subcategories: direct children of this category page
    const children = await fetchUmbracoChildren(cmsPageData.route.path);
    const categoryPrefix = `${cmsPageData.name} - `;
    const schemaCounts = await fetchSchemaCountsByUrl();
    const subCategories = children
      .filter((c: any) => c.contentType === "subCategoryPage")
      .map((c: any) => {
        const url = c.route?.path;
        const normalizedUrl = url ? normalizeUrl(url) : undefined;
        return {
          heading: c.name.startsWith(categoryPrefix) ? c.name.slice(categoryPrefix.length) : c.name,
          url,
          schemaCountText: normalizedUrl ? schemaCounts[normalizedUrl] : undefined,
        };
      })
      .sort((a: any, b: any) => a.heading.localeCompare(b.heading, "nb"));

    // Sidebar: all sibling categories
    const segments = cmsPageData.route.path.split("/").filter(Boolean);
    segments.pop(); // remove current category slug → "skjemaoversikt/kategori"
    const parentPath = segments.join("/");
    const allCategories = await fetchUmbracoChildren(parentPath);

    const pageSidebarViewModel = {
      titleItem: {
        label: "Alle tjenester",
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
