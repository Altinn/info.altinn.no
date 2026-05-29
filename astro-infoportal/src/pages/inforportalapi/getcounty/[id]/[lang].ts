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
    console.warn("[inforportalapi/getcounty] legacy numeric id, unsupported", {
      id,
      locale,
    });
    return legacyError("legacy_id_unsupported", 422, { id, locale });
  }

  try {
    const children = (await fetchUmbracoChildren(id, 500, locale)) as
      | SchemaTreeNode[]
      | undefined;
    const counties = (children ?? []).filter(
      (c) => c.contentType === "schemaCountyPage",
    );

    const items: MunicipalityItem[] = counties.map((c) => ({
      name: c.name ?? "",
      url: c.properties?.externalUrl || c.route?.path || "#",
      parent: "",
    }));
    items.sort((a, b) =>
      a.name.localeCompare(b.name, locale, { sensitivity: "base" }),
    );

    if (items.length === 0) {
      console.warn("[inforportalapi/getcounty] no items", { id, locale });
    }
    return legacyJson({ items });
  } catch (error) {
    console.error("[inforportalapi/getcounty] fetch failed", {
      id,
      locale,
      message: error instanceof Error ? error.message : String(error),
    });
    return legacyError("upstream error", 502);
  }
};
