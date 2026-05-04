import type { APIRoute } from "astro";
import { fetchUmbracoContentList } from "@api/umbraco/client";
import { jsonResponse } from "@api/altinn/client";
import type { Locale } from "@i18n/index";

const SUPPORTED_LOCALES = new Set(["nb", "nn", "en"]);
const MAX_ITEMS = 500;

type FilterItem = {
  id: string;
  name: string;
  properties?: {
    showInNavigation?: boolean;
  };
};

type SubsidyItem = {
  id: string;
  name: string;
  route?: {
    path?: string;
  };
  properties?: {
    showInNavigation?: boolean;
    mainIntro?: string;
    purposes?: FilterItem[] | null;
    industries?: FilterItem[] | null;
  };
};

function normalizeLocale(locale?: string): Locale {
  return SUPPORTED_LOCALES.has(locale ?? "") ? (locale as Locale) : "nb";
}

function visible(item: FilterItem | SubsidyItem): boolean {
  return item.properties?.showInNavigation !== false;
}

function mapFilterOption(item: FilterItem) {
  return {
    filterId: item.id,
    filterName: item.name,
  };
}

function filterIds(items?: FilterItem[] | null): string[] {
  return Array.isArray(items) ? items.map((item) => item.id) : [];
}

function mapSubsidy(item: SubsidyItem) {
  return {
    subsidyName: item.name,
    subsidyIntro: item.properties?.mainIntro ?? "",
    url: item.route?.path ?? "#",
    purposes: filterIds(item.properties?.purposes),
    industries: filterIds(item.properties?.industries),
  };
}

function selectedValues(url: URL, key: string): string[] {
  return url.searchParams
    .getAll(key)
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);
}

function matchesAny(selected: string[], values: string[]): boolean {
  return (
    selected.length === 0 ||
    values.some((value) => selected.includes(value))
  );
}

function matchesSubsidy(
  subsidy: ReturnType<typeof mapSubsidy>,
  selectedPurposes: string[],
  selectedIndustries: string[],
): boolean {
  const purposeMatch = matchesAny(selectedPurposes, subsidy.purposes);
  const industryMatch =
    selectedIndustries.length === 0 ||
    subsidy.industries.length === 0 ||
    subsidy.industries.some((industry) =>
      selectedIndustries.includes(industry),
    );

  return purposeMatch && industryMatch;
}

export const GET: APIRoute = async ({ params, url }) => {
  const locale = normalizeLocale(params.locale);
  const selectedPurposes = selectedValues(url, "purpose");
  const selectedIndustries = selectedValues(url, "industry");

  try {
    const [purposeItems, industryItems, subsidyItems] = await Promise.all([
      fetchUmbracoContentList(["contentType:purposePage"], MAX_ITEMS, locale),
      fetchUmbracoContentList(["contentType:industryPage"], MAX_ITEMS, locale),
      fetchUmbracoContentList(["contentType:subsidyPage"], MAX_ITEMS, locale),
    ]);

    const purposeList = (purposeItems as FilterItem[])
      .filter(visible)
      .map(mapFilterOption);
    const industryList = (industryItems as FilterItem[])
      .filter(visible)
      .map(mapFilterOption);
    const subsidiesList = (subsidyItems as SubsidyItem[])
      .filter(visible)
      .map(mapSubsidy)
      .filter((subsidy) =>
        matchesSubsidy(subsidy, selectedPurposes, selectedIndustries),
      );

    return jsonResponse({
      purposeList,
      industryList,
      subsidiesList,
    });
  } catch (error) {
    console.error("Failed to load subsidy overview data:", error);
    return jsonResponse(
      {
        purposeList: [],
        industryList: [],
        subsidiesList: [],
      },
      500,
    );
  }
};
