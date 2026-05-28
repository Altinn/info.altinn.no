import { fetchUmbracoContentList } from "@api/umbraco/client";
import type { APIRoute } from "astro";
import { rejectIfQueryString } from "../_lib/legacyGuards";
import { normalizeLegacyLocale } from "../_lib/legacyLocale";
import { legacyError, legacyJson } from "../_lib/legacyResponse";

export const prerender = false;

const MAX_ITEMS = 1000;

type FilterItem = {
  id: string;
  name: string;
};

type SubsidyItem = {
  id: string;
  name: string;
  route?: { path?: string };
  properties?: {
    mainIntro?: string;
    purposes?: FilterItem[] | null;
    industries?: FilterItem[] | null;
  };
};

function filterIds(items?: FilterItem[] | null): string[] {
  return Array.isArray(items) ? items.map((item) => item.id) : [];
}

export const GET: APIRoute = async ({ params, url }) => {
  const blocked = rejectIfQueryString(url);
  if (blocked) return blocked;

  const locale = normalizeLegacyLocale(params.lang);
  if (!locale) return legacyError("unsupported locale", 400);

  try {
    const [purposeItems, industryItems, subsidyItems] = await Promise.all([
      fetchUmbracoContentList(["contentType:purposePage"], MAX_ITEMS, locale),
      fetchUmbracoContentList(["contentType:industryPage"], MAX_ITEMS, locale),
      fetchUmbracoContentList(["contentType:subsidyPage"], MAX_ITEMS, locale),
    ]);

    const subsidiesList = (subsidyItems as SubsidyItem[]).map((s) => ({
      subsidyName: s.name,
      subsidyIntro: s.properties?.mainIntro ?? "",
      url: s.route?.path ?? "#",
      purposes: filterIds(s.properties?.purposes),
      industries: filterIds(s.properties?.industries),
    }));

    // Hide filter options that no subsidy references.
    const referencedPurposes = new Set(
      subsidiesList.flatMap((s) => s.purposes),
    );
    const referencedIndustries = new Set(
      subsidiesList.flatMap((s) => s.industries),
    );

    const purposeList = (purposeItems as FilterItem[])
      .filter((p) => referencedPurposes.has(p.id))
      .map((p) => ({ filterId: p.id, filterName: p.name }));

    const industryList = (industryItems as FilterItem[])
      .filter((i) => referencedIndustries.has(i.id))
      .map((i) => ({ filterId: i.id, filterName: i.name }));

    return legacyJson({
      purposeList,
      industryList,
      subsidiesList,
      maxItems: 10,
    });
  } catch (error) {
    console.error("[inforportalapi/getsubsidy] fetch failed", {
      locale,
      message: error instanceof Error ? error.message : String(error),
    });
    return legacyError("upstream error", 502);
  }
};
