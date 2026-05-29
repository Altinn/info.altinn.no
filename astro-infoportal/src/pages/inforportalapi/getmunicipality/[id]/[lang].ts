import { fetchUmbracoChildren } from "@api/umbraco/client";
import type { APIRoute } from "astro";
import {
  classifyMunicipalityId,
  rejectIfQueryString,
} from "../../_lib/legacyGuards";
import { normalizeLegacyLocale } from "../../_lib/legacyLocale";
import { legacyError, legacyJson } from "../../_lib/legacyResponse";

export const prerender = false;

interface SchemaTreeNode {
  contentType: string;
  name?: string;
  route?: { path?: string };
  properties?: {
    externalUrl?: string | null;
  };
}

interface MunicipalityItem {
  name: string;
  url: string;
  parent: string;
}

function toItem(node: SchemaTreeNode, parent: string): MunicipalityItem {
  return {
    name: node.name ?? "",
    url: node.properties?.externalUrl || node.route?.path || "#",
    parent,
  };
}

export const GET: APIRoute = async ({ params, url }) => {
  const blocked = rejectIfQueryString(url);
  if (blocked) return blocked;

  const locale = normalizeLegacyLocale(params.lang);
  if (!locale) return legacyError("unsupported locale", 400);

  const id = params.id;
  if (!id) return legacyError("missing id", 400);

  const kind = classifyMunicipalityId(id);
  if (kind === "invalid") return legacyError("invalid id", 400);
  if (kind === "legacy") {
    console.warn(
      "[inforportalapi/getmunicipality] legacy numeric id, unsupported",
      { id, locale },
    );
    return legacyError("legacy_id_unsupported", 422, { id, locale });
  }

  try {
    const children = ((await fetchUmbracoChildren(id, 500, locale)) ??
      []) as SchemaTreeNode[];
    const counties = children.filter(
      (c) => c.contentType === "schemaCountyPage" && c.route?.path,
    );
    const directMunicipalities = children.filter(
      (c) => c.contentType === "schemaMunicipalityPage",
    );

    let items: MunicipalityItem[];

    if (counties.length === 0 && directMunicipalities.length > 0) {
      items = directMunicipalities.map((m) => toItem(m, ""));
    } else if (counties.length > 0) {
      const perCounty = await Promise.all(
        counties.map(async (county) => {
          const munis = (await fetchUmbracoChildren(
            county.route?.path ?? "",
            500,
            locale,
          )) as SchemaTreeNode[] | undefined;
          return (munis ?? [])
            .filter((m) => m.contentType === "schemaMunicipalityPage")
            .map((m) => toItem(m, county.name ?? ""));
        }),
      );
      items = perCounty.flat();
    } else {
      items = [];
    }

    items.sort((a, b) =>
      a.name.localeCompare(b.name, locale, { sensitivity: "base" }),
    );

    if (items.length === 0) {
      console.warn("[inforportalapi/getmunicipality] no items", { id, locale });
    }
    return legacyJson({ items });
  } catch (error) {
    console.error("[inforportalapi/getmunicipality] fetch failed", {
      id,
      locale,
      message: error instanceof Error ? error.message : String(error),
    });
    return legacyError("upstream error", 502);
  }
};
