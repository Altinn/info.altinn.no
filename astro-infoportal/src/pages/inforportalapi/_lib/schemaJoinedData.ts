import {
  fetchUmbracoChildren,
  fetchUmbracoContentList,
} from "@api/umbraco/client";

export const CATEGORY_ROOT_GUID = "7be52f06-4b7f-43e3-be3e-7871e56c27fc";
// Delivery API rejects skip + take > 1000; fetchAllSchemas paginates around it.
const MAX_ITEMS = 1000;

export interface Ref {
  id: string;
  name?: string;
  route?: { path?: string };
}

export interface CategoryNode extends Ref {
  contentType: "categoryPage";
  properties?: {
    icon?: string;
    showInNavigation?: boolean;
  };
}

export interface SubCategoryNode extends Ref {
  contentType: "subCategoryPage";
  properties?: {
    showInNavigation?: boolean;
  };
}

export interface RichTextValue {
  items?: Array<{ html?: string }>;
}

export interface SchemaNode extends Ref {
  contentType: "schemaPage";
  properties?: {
    portalSchemaId?: number;
    schemaCode?: string;
    mainIntro?: RichTextValue | null;
    subCategories?: Ref[] | null;
    providers?: Ref[] | null;
  };
}

export interface ProviderNode extends Ref {
  contentType: "providerPage";
  properties?: {
    providerAcronym?: string;
    providerOrgNr?: string | null;
    showInNavigation?: boolean;
  };
}

export interface SchemaJoinedData {
  categories: CategoryNode[];
  subCategoriesByCategory: SubCategoryNode[][];
  schemas: SchemaNode[];
  providers: ProviderNode[];
  providerById: Map<string, ProviderNode>;
  schemasBySubCategory: Map<string, SchemaNode[]>;
  schemasByProvider: Map<string, SchemaNode[]>;
}

// Per-provider fan-out sidesteps the Delivery API's skip+take cap. A single
// provider returning 500 is logged + skipped so one bad record doesn't fail
// the whole response.
export async function fetchAllSchemas(
  providers: ProviderNode[],
  locale: string,
): Promise<SchemaNode[]> {
  const perProvider = await Promise.all(
    providers.map(async (p) => {
      if (!p.route?.path) return [] as SchemaNode[];
      try {
        return (await fetchUmbracoChildren(
          p.route.path,
          MAX_ITEMS,
          locale,
        )) as SchemaNode[];
      } catch (error) {
        console.warn("[inforportalapi] provider children fetch failed", {
          providerId: p.id,
          path: p.route.path,
          locale,
          message: error instanceof Error ? error.message : String(error),
        });
        return [] as SchemaNode[];
      }
    }),
  );
  return perProvider.flat().filter((s) => s.contentType === "schemaPage");
}

export async function loadSchemaJoinedData(
  locale: string,
): Promise<SchemaJoinedData> {
  const [categories, providers] = await Promise.all([
    fetchUmbracoChildren(CATEGORY_ROOT_GUID, MAX_ITEMS, locale) as Promise<
      CategoryNode[]
    >,
    fetchUmbracoContentList(
      ["contentType:providerPage"],
      MAX_ITEMS,
      locale,
    ) as Promise<ProviderNode[]>,
  ]);
  const schemas = await fetchAllSchemas(providers, locale);

  const subCategoriesByCategory = (await Promise.all(
    categories.map((cat) =>
      cat.route?.path
        ? fetchUmbracoChildren(cat.route.path, MAX_ITEMS, locale)
        : Promise.resolve([]),
    ),
  )) as SubCategoryNode[][];

  const providerById = new Map<string, ProviderNode>();
  for (const p of providers) providerById.set(p.id, p);

  const schemasBySubCategory = new Map<string, SchemaNode[]>();
  const schemasByProvider = new Map<string, SchemaNode[]>();
  for (const s of schemas) {
    for (const ref of s.properties?.subCategories ?? []) {
      const arr = schemasBySubCategory.get(ref.id) ?? [];
      arr.push(s);
      schemasBySubCategory.set(ref.id, arr);
    }
    for (const ref of s.properties?.providers ?? []) {
      const arr = schemasByProvider.get(ref.id) ?? [];
      arr.push(s);
      schemasByProvider.set(ref.id, arr);
    }
  }

  return {
    categories,
    subCategoriesByCategory,
    schemas,
    providers,
    providerById,
    schemasBySubCategory,
    schemasByProvider,
  };
}

// SubCategory names ship as "{idx} - {name}"; the prefix isn't part of the contract.
export function stripDashPrefix(name: string): string {
  const idx = name.indexOf("-");
  return idx >= 0 ? name.slice(idx + 2) : name;
}

export interface ProviderSummary {
  name: string;
  acronym: string;
  orgNr: string;
  url: string;
  pageLink: { id: string };
}

export function providersForSchema(
  schema: SchemaNode,
  providerById: Map<string, ProviderNode>,
): ProviderSummary[] {
  const refs = schema.properties?.providers ?? [];
  return refs
    .map((ref) => providerById.get(ref.id))
    .filter((p): p is ProviderNode => !!p)
    .map((p) => ({
      name: p.name ?? "",
      acronym: p.properties?.providerAcronym ?? "",
      orgNr: p.properties?.providerOrgNr ?? "",
      url: p.route?.path ?? "",
      pageLink: { id: p.id },
    }));
}

export interface SchemaSummary {
  id: string;
  title: string;
  url: string;
  providers: ProviderSummary[];
  language: string;
  pageLink: { id: string };
}

export function schemaSummary(
  schema: SchemaNode,
  providerById: Map<string, ProviderNode>,
): SchemaSummary {
  const code = schema.properties?.schemaCode;
  const baseTitle = schema.name ?? "";
  return {
    id: schema.id,
    title: code ? `${baseTitle} (${code})` : baseTitle,
    url: schema.route?.path ?? "",
    providers: providersForSchema(schema, providerById),
    language: "",
    pageLink: { id: schema.id },
  };
}
