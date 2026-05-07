import type { Locale } from "@i18n/index";

export interface AltinnOrganization {
  acronym: string;
  name: Record<string, string>;
  logo?: string;
  emblem?: string;
  orgnr?: string;
  homepage?: string;
}

export interface ProviderInfo {
  name: string;
  imageUrl: string;
  url: string;
}

const ORGS_URL = "https://altinncdn.no/orgs/altinn-orgs.json";
const CACHE_TTL_MS = 60 * 60 * 1000;
const CACHE_TTL_SECONDS = 60 * 60;

let memoizedResolver: { resolver: ProviderResolver; expiresAt: number } | null =
  null;

export function normalizeName(value?: string): string {
  return (value ?? "")
    .replace(/\(.*?\)/g, "")
    .replace(/ø/g, "o")
    .replace(/æ/g, "ae")
    .replace(/å/g, "a")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase();
}

type WorkersFetchInit = RequestInit & {
  cf?: { cacheEverything?: boolean; cacheTtl?: number };
};

export class ProviderResolver {
  private byAcronym = new Map<string, AltinnOrganization>();
  private byOrgNr = new Map<string, AltinnOrganization>();
  private byNameByLocale = new Map<string, Map<string, AltinnOrganization>>();

  private constructor() {}

  static async create(
    fetchFn: typeof fetch = fetch,
  ): Promise<ProviderResolver> {
    const now = Date.now();
    if (memoizedResolver && memoizedResolver.expiresAt > now) {
      return memoizedResolver.resolver;
    }

    const resolver = new ProviderResolver();
    try {
      const init: WorkersFetchInit = {
        cf: { cacheEverything: true, cacheTtl: CACHE_TTL_SECONDS },
      };
      const res = await fetchFn(ORGS_URL, init);
      const json = (await res.json()) as {
        orgs?: Record<string, Omit<AltinnOrganization, "acronym">>;
      };
      resolver.indexOrgs(json.orgs ?? {});
      memoizedResolver = { resolver, expiresAt: now + CACHE_TTL_MS };
    } catch {
      // CDN failure → empty resolver this request; do not memoize the failure.
    }
    return resolver;
  }

  resolveOrganization(
    input: { acronym?: string; orgnr?: string; name?: string },
    locale: Locale,
  ): AltinnOrganization | undefined {
    if (input.acronym) {
      const hit = this.byAcronym.get(input.acronym.toLowerCase());
      if (hit) return hit;
    }
    if (input.orgnr) {
      const hit = this.byOrgNr.get(String(input.orgnr));
      if (hit) return hit;
    }
    if (input.name) {
      const hit = this.byNameByLocale
        .get(locale)
        ?.get(normalizeName(input.name));
      if (hit) return hit;
    }
    return undefined;
  }

  resolveImageUrl(
    acronym: string | undefined,
    orgnr: string | undefined,
    name: string,
    locale: Locale,
  ): string {
    const org = this.resolveOrganization({ acronym, orgnr, name }, locale);
    return org?.emblem || org?.logo || "";
  }

  private indexOrgs(
    orgs: Record<string, Omit<AltinnOrganization, "acronym">>,
  ): void {
    for (const [acronym, raw] of Object.entries(orgs)) {
      const org: AltinnOrganization = { ...raw, acronym, name: raw.name ?? {} };
      this.byAcronym.set(acronym.toLowerCase(), org);
      if (org.orgnr) this.byOrgNr.set(org.orgnr, org);
      for (const [loc, name] of Object.entries(org.name)) {
        if (!name) continue;
        const map = this.byNameByLocale.get(loc) ?? new Map();
        map.set(normalizeName(name), org);
        this.byNameByLocale.set(loc, map);
      }
    }
  }
}
