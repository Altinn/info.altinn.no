import type { APIRoute } from "astro";
import { rejectIfQueryString } from "../_lib/legacyGuards";
import { normalizeLegacyLocale } from "../_lib/legacyLocale";
import { legacyError, legacyJson } from "../_lib/legacyResponse";
import {
  loadSchemaJoinedData,
  schemaSummary,
  stripDashPrefix,
} from "../_lib/schemaJoinedData";

export const prerender = false;

export const GET: APIRoute = async ({ params, url }) => {
  const blocked = rejectIfQueryString(url);
  if (blocked) return blocked;

  const locale = normalizeLegacyLocale(params.lang);
  if (!locale) return legacyError("unsupported locale", 400);

  try {
    const data = await loadSchemaJoinedData(locale);

    const response = data.categories.map((cat, idx) => {
      const subCats = data.subCategoriesByCategory[idx] ?? [];
      return {
        id: cat.id,
        heading: cat.name ?? "",
        icon: cat.properties?.icon ?? "",
        contentLink: { id: cat.id },
        subCategories: subCats.map((sc) => {
          const schemaList = (data.schemasBySubCategory.get(sc.id) ?? []).map(
            (s) => schemaSummary(s, data.providerById),
          );
          schemaList.sort((a, b) =>
            a.title.localeCompare(b.title, locale, { sensitivity: "base" }),
          );
          return {
            id: sc.id,
            heading: stripDashPrefix(sc.name ?? ""),
            contentLink: { id: sc.id },
            schemaList,
          };
        }),
      };
    });

    return legacyJson(response);
  } catch (error) {
    console.error("[inforportalapi/getcategory] fetch failed", {
      locale,
      message: error instanceof Error ? error.message : String(error),
    });
    return legacyError("upstream error", 502);
  }
};
