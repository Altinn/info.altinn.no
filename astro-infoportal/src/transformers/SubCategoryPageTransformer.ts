import { type Locale, t } from "@i18n/index";
import {
  type ProviderInfo,
  ProviderResolver,
} from "@services/Providers/ProviderResolver";
import {
  fetchUmbracoAncestors,
  fetchUmbracoChildren,
  fetchUmbracoContent,
  fetchUmbracoRelated,
  resolveBlockReferences,
} from "../api/umbraco/client";
import { BlockTransformer } from "./BlockTransformer";
import { BreadcrumbsTransformer } from "./BreadcrumbsTransformer";
import type { IJSONTransformer } from "./IJSONTransformer";

export class SubCategoryPageTransformer implements IJSONTransformer {
  public async Transform(cmsPageData: any, globalData?: any): Promise<any> {
    const props = cmsPageData.properties ?? {};
    const locale: Locale = globalData?.locale || "nb";
    const resolver = await ProviderResolver.create();

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

    const related = await fetchUmbracoRelated(
      "/skjemaoversikt",
      "schemaPage",
      "subCategory",
      cmsPageData.id,
    );

    const schemas = await Promise.all(
      related.map(async (s: any) => {
        let providers: ProviderInfo[] = [];
        let schemaCode: string | null = null;

        try {
          const fullSchema = await fetchUmbracoContent(s.route?.path, locale);
          schemaCode = fullSchema.properties?.schemaCode || null;
          const resolvedRefs = await resolveBlockReferences(
            fullSchema.properties?.providers,
            locale,
          );
          providers = resolvedRefs.map((ref: any) => {
            const name = ref?.name ?? "";
            return {
              name,
              imageUrl: resolver.resolveImageUrl(
                ref?.properties?.providerAcronym,
                ref?.properties?.providerOrgNr,
                name,
                locale,
              ),
              url: ref?.route?.path ?? "",
            };
          });
        } catch {
          // Schema fetch failed — emit without icons.
        }

        const title = schemaCode ? `${s.name} (${schemaCode})` : s.name;
        return {
          id: s.id,
          title,
          url: s.route?.path,
          providers,
          componentName: "SchemaData",
        };
      }),
    );

    // Sidebar: "Alle tjenester" title, parent category as selected mainItem,
    // sibling subcategories as subItems with category prefix stripped.
    const segments = cmsPageData.route.path.split("/").filter(Boolean);
    const parentCategoryPath = segments.slice(0, 3).join("/");

    const parentCategory = ancestors.find((a: any) => {
      const aPath = (a.route?.path || "").replace(/^\/|\/$/g, "");
      return aPath === parentCategoryPath;
    });

    const categoryPrefix = parentCategory?.name
      ? `${parentCategory.name} - `
      : "";
    const stripPrefix = (name: string) =>
      categoryPrefix && name.startsWith(categoryPrefix)
        ? name.slice(categoryPrefix.length)
        : name;

    let subItems: any[] = [];
    if (parentCategory) {
      const siblings = await fetchUmbracoChildren(parentCategory.route.path);
      subItems = siblings
        .filter((sub: any) => sub.contentType === "subCategoryPage")
        .map((sub: any) => ({
          label: stripPrefix(sub.name),
          url: sub.route?.path,
          current: sub.id === cmsPageData.id,
        }))
        .sort((a: any, b: any) => a.label.localeCompare(b.label, locale));
    }

    const pageSidebarViewModel = {
      titleItem: {
        label: t("schemaOverview.allServices", locale),
        url: "/skjemaoversikt",
        icon: "MenuGridIcon",
      },
      mainItems: [
        {
          label: parentCategory?.name || t("schema.accordions.category", locale),
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
      accordionsHeading: props.accordionsHeading || undefined,
      pageSidebarViewModel,
    };
  }
}
