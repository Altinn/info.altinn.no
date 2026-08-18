import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchUmbracoAncestors = vi.fn();
const fetchUmbracoChildren = vi.fn();
const fetchUmbracoContentCount = vi.fn();

vi.mock("../api/umbraco/client", () => ({
  fetchUmbracoAncestors: (...args: any[]) => fetchUmbracoAncestors(...args),
  fetchUmbracoChildren: (...args: any[]) => fetchUmbracoChildren(...args),
  fetchUmbracoContentCount: (...args: any[]) =>
    fetchUmbracoContentCount(...args),
}));

const { CategoryPageTransformer } = await import("./CategoryPageTransformer");

// The EN variants of these nodes keep the bokmål "Starte, endre, avvikle - "
// prefix, which is exactly what issue #371 reports leaking into the headings.
const subCategory = (name: string, slug: string, id: string) => ({
  contentType: "subCategoryPage",
  id,
  name,
  route: { path: `/en/forms-overview/kategori/start-change-wind-up/${slug}/` },
});

const enChildren = [
  subCategory(
    "Starte, endre, avvikle - Start business",
    "start-business",
    "sub-1",
  ),
  subCategory(
    "Starte, endre, avvikle - Change business",
    "change-business",
    "sub-2",
  ),
  subCategory(
    "Starte, endre, avvikle - Liquidation and bankruptcy",
    "liquidation-and-bankruptcy",
    "sub-3",
  ),
];

const counts: Record<string, number> = {
  "sub-1": 11,
  "sub-2": 12,
  "sub-3": 11,
};

const cmsPageData = {
  id: "cat-1",
  name: "Start, change, liquidate",
  route: { path: "/en/forms-overview/kategori/start-change-wind-up/" },
  properties: {},
};

async function transform(children = enChildren, locale = "en") {
  fetchUmbracoChildren.mockImplementation(async (path: string) =>
    path === cmsPageData.route.path ? children : [],
  );
  const result = await new CategoryPageTransformer().Transform(cmsPageData, {
    locale,
    contentLocale: locale,
  });
  return result;
}

beforeEach(() => {
  vi.clearAllMocks();
  fetchUmbracoAncestors.mockResolvedValue([]);
  fetchUmbracoContentCount.mockImplementation(async (filters: string[]) => {
    const id = filters
      .find((f) => f.startsWith("subCategory:"))
      ?.slice("subCategory:".length);
    return counts[id ?? ""] ?? 0;
  });
});

describe("CategoryPageTransformer subcategories", () => {
  it("strips the bokmål category prefix on a locale whose page name differs", async () => {
    const { subCategories } = await transform();

    expect(subCategories.map((s: any) => s.heading)).toEqual([
      "Start business",
      "Change business",
      "Liquidation and bankruptcy",
    ]);
  });

  it("keeps the order the editors arranged in Umbraco", async () => {
    const { subCategories } = await transform();

    // Alphabetical would be Change / Liquidation / Start — the old prod page
    // listed them in editor order, so no re-sorting here.
    expect(subCategories[0].heading).toBe("Start business");
    expect(subCategories[2].heading).toBe("Liquidation and bankruptcy");
  });

  it("keeps only the first ' - ' as the prefix separator", async () => {
    const { subCategories } = await transform([
      subCategory(
        "Permits and qualifications - E - Water supply and sewerage",
        "water-supply",
        "sub-1",
      ),
      subCategory("Language and Library services", "language-library", "sub-2"),
    ]);

    expect(subCategories.map((s: any) => s.heading)).toEqual([
      "E - Water supply and sewerage",
      "Language and Library services",
    ]);
  });
});

describe("CategoryPageTransformer schema counts", () => {
  it("counts schemas in bokmål regardless of the page locale", async () => {
    await transform();

    for (const call of fetchUmbracoContentCount.mock.calls) {
      expect(call[1]).toBe("nb");
      expect(call[0]).toContain("contentType:schemaPage");
    }
  });

  it("renders the count in the page locale", async () => {
    expect(
      (await transform(enChildren, "en")).subCategories[0].schemaCountText,
    ).toBe("11 services");
    expect(
      (await transform(enChildren, "nb")).subCategories[1].schemaCountText,
    ).toBe("12 tjenester");
    expect(
      (await transform(enChildren, "nn")).subCategories[2].schemaCountText,
    ).toBe("11 tenester");
  });

  it("uses the singular form for a lone schema", async () => {
    fetchUmbracoContentCount.mockResolvedValue(1);

    expect(
      (await transform(enChildren, "en")).subCategories[0].schemaCountText,
    ).toBe("1 service");
    expect(
      (await transform(enChildren, "nb")).subCategories[0].schemaCountText,
    ).toBe("1 tjeneste");
    expect(
      (await transform(enChildren, "nn")).subCategories[0].schemaCountText,
    ).toBe("1 teneste");
  });

  it("omits the badge when the count is zero or unavailable", async () => {
    fetchUmbracoContentCount.mockResolvedValueOnce(0);
    fetchUmbracoContentCount.mockRejectedValueOnce(
      new Error("Umbraco is down"),
    );

    const { subCategories } = await transform();

    expect(subCategories[0].schemaCountText).toBeUndefined();
    expect(subCategories[1].schemaCountText).toBeUndefined();
    expect(subCategories[2].schemaCountText).toBe("11 services");
  });
});

describe("CategoryPageTransformer sidebar", () => {
  it("translates the 'all services' title", async () => {
    expect(
      (await transform(enChildren, "en")).pageSidebarViewModel.titleItem.label,
    ).toBe("All services");
    expect(
      (await transform(enChildren, "nb")).pageSidebarViewModel.titleItem.label,
    ).toBe("Alle tjenester");
  });
});
