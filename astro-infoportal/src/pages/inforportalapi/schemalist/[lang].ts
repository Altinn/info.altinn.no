import {
  fetchUmbracoChildren,
  fetchUmbracoContentList,
} from "@api/umbraco/client";
import type { APIRoute } from "astro";
import { rejectIfQueryString } from "../_lib/legacyGuards";
import { normalizeLegacyLocale } from "../_lib/legacyLocale";
import { legacyError, legacyJson } from "../_lib/legacyResponse";
import {
  CATEGORY_ROOT_GUID,
  fetchAllSchemas,
  type ProviderNode,
  type RichTextValue,
  type SchemaNode,
  stripDashPrefix,
} from "../_lib/schemaJoinedData";

export const prerender = false;

const CATEGORIES_TAKE = 100;
const PROVIDERS_TAKE = 200;

type Ref = {
  id: string;
  name?: string;
  route?: { path?: string };
};

type CategoryItem = Ref & {
  contentType: "categoryPage";
};

type SubCategoryItem = Ref & {
  contentType: "subCategoryPage";
};

function extractRichTextHtml(
  mainIntro: RichTextValue | null | undefined,
): string {
  if (!mainIntro || !mainIntro.items) return "";
  return mainIntro.items
    .map((item) => item.html ?? "")
    .filter(Boolean)
    .join("");
}

export const GET: APIRoute = async ({ params, url }) => {
  const blocked = rejectIfQueryString(url);
  if (blocked) return blocked;

  const locale = normalizeLegacyLocale(params.lang);
  if (!locale) return legacyError("unsupported locale", 400);

  try {
    const [categories, providers] = await Promise.all([
      fetchUmbracoChildren(CATEGORY_ROOT_GUID, CATEGORIES_TAKE, locale),
      fetchUmbracoContentList(
        ["contentType:providerPage"],
        PROVIDERS_TAKE,
        locale,
      ) as Promise<ProviderNode[]>,
    ]);
    const schemas: SchemaNode[] = await fetchAllSchemas(providers, locale);

    const subCategoriesByCategory = await Promise.all(
      (categories as CategoryItem[]).map((cat) =>
        cat.route?.path
          ? fetchUmbracoChildren(cat.route.path, CATEGORIES_TAKE, locale)
          : Promise.resolve([]),
      ),
    );

    const categoryPackages = (categories as CategoryItem[]).map((cat, idx) => {
      const subCats = (subCategoriesByCategory[idx] as SubCategoryItem[]) ?? [];
      return {
        id: cat.id,
        texts: [{ name: cat.name ?? "", language: locale }],
        subCategories: subCats.map((sc) => ({
          id: sc.id,
          texts: [{ name: stripDashPrefix(sc.name ?? ""), language: locale }],
        })),
      };
    });

    // Schemas without a portalSchemaId aren't real services.
    const servicePackages = schemas
      .filter((s) => (s.properties?.portalSchemaId ?? 0) > 0)
      .map((s) => {
        const props = s.properties ?? {};
        const subCategoryIds = Array.isArray(props.subCategories)
          ? props.subCategories.map((ref) => ref.id)
          : [];
        return {
          serviceCode: props.portalSchemaId ?? 0,
          texts: [
            {
              language: locale,
              name: s.name ?? "",
              intro: extractRichTextHtml(props.mainIntro),
            },
          ],
          categories: subCategoryIds,
        };
      });

    return legacyJson({
      categories: categoryPackages,
      services: servicePackages,
    });
  } catch (error) {
    console.error("[inforportalapi/schemalist] fetch failed", {
      locale,
      message: error instanceof Error ? error.message : String(error),
    });
    return legacyError("upstream error", 502);
  }
};
