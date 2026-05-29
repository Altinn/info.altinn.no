import type { APIRoute } from "astro";
import { rejectIfQueryString } from "../_lib/legacyGuards";
import { normalizeLegacyLocale } from "../_lib/legacyLocale";
import { legacyError, legacyJson } from "../_lib/legacyResponse";
import { loadSchemaJoinedData, schemaSummary } from "../_lib/schemaJoinedData";

export const prerender = false;

export const GET: APIRoute = async ({ params, url }) => {
  const blocked = rejectIfQueryString(url);
  if (blocked) return blocked;

  const locale = normalizeLegacyLocale(params.lang);
  if (!locale) return legacyError("unsupported locale", 400);

  try {
    const data = await loadSchemaJoinedData(locale);

    const providers = [...data.providers].sort((a, b) =>
      (a.name ?? "").localeCompare(b.name ?? "", locale, {
        sensitivity: "base",
      }),
    );

    // `mainbody` is always null — legacy contract field, never populated.
    const response = providers.map((p) => {
      const list = (data.schemasByProvider.get(p.id) ?? []).map((s) =>
        schemaSummary(s, data.providerById),
      );
      list.sort((a, b) =>
        a.title.localeCompare(b.title, locale, { sensitivity: "base" }),
      );
      return {
        id: p.id,
        heading: p.name ?? "",
        acronym: p.properties?.providerAcronym ?? "",
        orgNr: p.properties?.providerOrgNr ?? "",
        mainbody: null,
        contentLink: { id: p.id },
        list,
      };
    });

    return legacyJson(response);
  } catch (error) {
    console.error("[inforportalapi/getprovider] fetch failed", {
      locale,
      message: error instanceof Error ? error.message : String(error),
    });
    return legacyError("upstream error", 502);
  }
};
