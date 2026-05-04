type OrgInfo = {
  name?: Record<string, string>;
  logo?: string;
  emblem?: string;
  orgnr?: string;
};

type OrgLookup = {
  byCode: Record<string, OrgInfo>;
  byOrgNr: Record<string, OrgInfo>;
  byName: Record<string, OrgInfo>;
  bySlugToken: Record<string, OrgInfo>;
  all: OrgInfo[];
};

export type ProviderLike = {
  name?: string;
  route?: { path?: string };
  properties?: Record<string, any>;
};

const TOKEN_STOP_WORDS = new Set([
  "and",
  "administration",
  "authority",
  "centre",
  "center",
  "service",
  "services",
  "the",
  "norwegian",
]);

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

function providerSlug(provider: ProviderLike): string {
  return provider.route?.path?.split("/").filter(Boolean).pop() ?? "";
}

function tokens(value?: string): string[] {
  return normalizeName(value)
    .split(" ")
    .filter((token) => token && !TOKEN_STOP_WORDS.has(token));
}

function orgNames(org: OrgInfo): string[] {
  return Object.values(org.name ?? {});
}

function orgIcon(org?: OrgInfo): string {
  return org?.emblem || org?.logo || "";
}

export function buildOrgLookup(orgs: Record<string, OrgInfo>): OrgLookup {
  const lookup: OrgLookup = {
    byCode: {},
    byOrgNr: {},
    byName: {},
    bySlugToken: {},
    all: [],
  };

  for (const [code, org] of Object.entries(orgs)) {
    const normalizedCode = code.toLowerCase();
    lookup.byCode[normalizedCode] = org;
    lookup.bySlugToken[normalizedCode] = org;
    lookup.all.push(org);

    if (org.orgnr) {
      lookup.byOrgNr[org.orgnr] = org;
    }

    for (const name of orgNames(org)) {
      lookup.byName[normalizeName(name)] = org;
    }
  }

  return lookup;
}

export function resolveProviderIcon(provider: ProviderLike, lookup: OrgLookup): string {
  const providerId = provider.properties?.providerId ?? provider.properties?.importId;
  if (providerId != null) {
    const org = lookup.byCode[String(providerId).toLowerCase()];
    if (org) return orgIcon(org);
  }

  const orgnr = provider.properties?.orgnr;
  if (orgnr != null) {
    const org = lookup.byOrgNr[String(orgnr)];
    if (org) return orgIcon(org);
  }

  for (const token of tokens(providerSlug(provider))) {
    const org = lookup.bySlugToken[token];
    if (org) return orgIcon(org);
  }

  const nameOrg = lookup.byName[normalizeName(provider.name)];
  if (nameOrg) return orgIcon(nameOrg);

  const providerTokens = tokens(`${provider.name ?? ""} ${providerSlug(provider)}`);
  if (providerTokens.length) {
    for (const org of lookup.all) {
      const searchable = tokens(orgNames(org).join(" "));
      if (
        providerTokens.every((token) => searchable.includes(token)) ||
        searchable.every((token) => providerTokens.includes(token))
      ) {
        return orgIcon(org);
      }
    }
  }

  return "";
}
