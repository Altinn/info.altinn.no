import type { MunicipalityItem } from "../../Models/Local/MunicipalityItem";
import { fetchUmbracoChildren } from "./client";

export type MunicipalitySearchKind = "municipality" | "county" | null;

export interface MunicipalitySearchData {
  kind: MunicipalitySearchKind;
  items: MunicipalityItem[];
}

const EMPTY: MunicipalitySearchData = { kind: null, items: [] };

function toItem(node: any, parent: string): MunicipalityItem {
  return {
    name: node.name,
    url: node.properties?.externalUrl || node.route?.path || "#",
    parent,
  };
}

/**
 * Walk the Umbraco subtree below `currentPagePath` to determine whether the
 * schema page should expose a municipality or county search, and return the
 * search items in legacy `{name, url, parent}` shape.
 *
 * Three branches:
 *  - Direct `schemaMunicipalityPage` children → municipality search.
 *  - `schemaCountyPage` children with no municipality grandchildren → county search.
 *  - `schemaCountyPage` children whose first county has municipality grandchildren
 *    → municipality search, flattened across counties with `parent=county.name`.
 *
 * Returns `{kind: null, items: []}` for pages with no relevant descendants.
 */
export async function buildMunicipalitySearch(
  currentPagePath: string | undefined,
  locale: string,
): Promise<MunicipalitySearchData> {
  if (!currentPagePath) return EMPTY;

  const directChildren = await fetchUmbracoChildren(
    currentPagePath,
    500,
    locale,
  );

  const countyChildren = directChildren.filter(
    (c: any) => c.contentType === "schemaCountyPage" && c.route?.path,
  );
  const municipalityChildren = directChildren.filter(
    (c: any) => c.contentType === "schemaMunicipalityPage" && c.route?.path,
  );

  if (countyChildren.length === 0 && municipalityChildren.length > 0) {
    return {
      kind: "municipality",
      items: municipalityChildren.map((m: any) => toItem(m, "")),
    };
  }

  if (countyChildren.length === 0) return EMPTY;

  const firstCountyChildren = await fetchUmbracoChildren(
    countyChildren[0].route.path,
    500,
    locale,
  );
  const firstCountyMunicipalities = firstCountyChildren.filter(
    (m: any) => m.contentType === "schemaMunicipalityPage",
  );

  if (firstCountyMunicipalities.length === 0) {
    return {
      kind: "county",
      items: countyChildren.map((c: any) => toItem(c, "")),
    };
  }

  const allMunis = await Promise.all(
    countyChildren.map(async (county: any) => {
      const munis = await fetchUmbracoChildren(
        county.route.path,
        500,
        locale,
      );
      return munis
        .filter((m: any) => m.contentType === "schemaMunicipalityPage")
        .map((m: any) => toItem(m, county.name));
    }),
  );

  return {
    kind: "municipality",
    items: allMunis.flat(),
  };
}
