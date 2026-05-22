import { type Locale, t } from "@i18n/index";
import {
  type ProviderInfo,
  ProviderResolver,
} from "@services/Providers/ProviderResolver";
import {
  fetchUmbracoAncestors,
  fetchUmbracoChildren,
  fetchUmbracoContentById,
  fetchUmbracoRelated,
  resolveBlockReferences,
} from "../api/umbraco/client";
import { BlockTransformer } from "./BlockTransformer";
import { BreadcrumbsTransformer } from "./BreadcrumbsTransformer";
import { stripCategoryPrefix } from "./categoryPrefix";
import type { IJSONTransformer } from "./IJSONTransformer";

export class SubCategoryPageTransformer implements IJSONTransformer {
  public async Transform(cmsPageData: any, globalData?: any): Promise<any> {
    const props = cmsPageData.properties ?? {};
    const locale: Locale = globalData?.locale || "nb";
    const contentLocale: Locale = globalData?.contentLocale || locale;
    const resolver = await ProviderResolver.create();

    const ancestors = await fetchUmbracoAncestors(cmsPageData.id, contentLocale);
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

        let fullSchema: any = null;
        try {
          fullSchema = await fetchUmbracoContentById(s.id, contentLocale);
          schemaCode = fullSchema?.properties?.schemaCode || null;
          const resolvedRefs = await resolveBlockReferences(
            fullSchema?.properties?.providers,
            contentLocale,
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
          // Schema fetch failed in both the requested locale and NB — emit
          // the row without icons rather than dropping it entirely.
        }

        const name = fullSchema?.name ?? s.name;
        const url = fullSchema?.route?.path ?? s.route?.path;
        const title = schemaCode ? `${name} (${schemaCode})` : name;
        return {
          id: s.id,
          title,
          url,
          providers,
          componentName: "SchemaData",
        };
      }),
    );

    // Sidebar: "Alle tjenester" title, parent category as selected mainItem,
    // sibling subcategories as subItems with category prefix stripped.
    // The parent is always the categoryPage ancestor — looking it up by
    // contentType avoids path-string matching, which breaks on NN/EN where
    // route.path carries a locale prefix (e.g. /nn/skjemaoversikt/...).
    const parentCategory = ancestors.find(
      (a: any) => a.contentType === "categoryPage",
    );

    let subItems: any[] = [];
    if (parentCategory) {
      const siblings = await fetchUmbracoChildren(parentCategory.route.path, 100, contentLocale);
      subItems = siblings
        .filter((sub: any) => sub.contentType === "subCategoryPage")
        .map((sub: any) => ({
          label: stripCategoryPrefix(sub.name),
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
      pageName: stripCategoryPrefix(cmsPageData.name),
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
