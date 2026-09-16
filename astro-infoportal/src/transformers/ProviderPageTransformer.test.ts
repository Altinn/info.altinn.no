import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProviderPageTransformer } from "./ProviderPageTransformer";

// Issue #705: the provider lists its services as children, and Umbraco only
// returns children published in the requested culture. Three services in
// bokmål, one translated — so the English page showed a single service and the
// support case asked why the other two had disappeared.
const EN_PATH = "/en/forms-overview/medicines-agency/";
const NB_PATH = "/skjemaoversikt/statens-legemiddelverk/";

const schema = (id: string, name: string, path: string) => ({
  id,
  name,
  contentType: "schemaPage",
  route: { path },
  properties: {},
});

const translated = schema(
  "b753",
  "Medicinal products for animals",
  `${EN_PATH}medicinal-products/`,
);
const nbChildren = [
  schema(
    "b753",
    "Unntak fra krav om markedsføringstillatelse",
    `${NB_PATH}godkjenningsfritak/`,
  ),
  schema("3b00", "Apotekdrift", `${NB_PATH}apotekdrift/`),
  schema(
    "6e91",
    "Hente konsesjonsrapport",
    `${NB_PATH}hente-konsesjonsrapport/`,
  ),
];

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const stubFetch = () =>
  vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request(input, init);
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/umbraco")) return json({ orgs: {} });
    if (url.pathname.includes("/content/item/")) return json({}, 404);

    const path = (url.searchParams.get("fetch") ?? "").replace("children:", "");
    if (path === EN_PATH) return json({ items: [translated], total: 1 });
    if (path === NB_PATH) return json({ items: nbChildren, total: 3 });
    return json({ items: [], total: 0 });
  });

const page = {
  id: "provider-1",
  name: "Norwegian Medical Products Agency",
  route: { path: EN_PATH },
  cultures: { nb: { path: NB_PATH }, en: { path: EN_PATH } },
  properties: {},
};

const transformEnglish = () =>
  new ProviderPageTransformer().Transform(page, {
    locale: "en",
    contentLocale: "en",
  });

describe("ProviderPageTransformer language fallback", () => {
  beforeEach(() => vi.stubGlobal("fetch", stubFetch()));
  afterEach(() => vi.unstubAllGlobals());

  it("lists the services that exist only in bokmål alongside the translated one", async () => {
    const result = await transformEnglish();

    expect(result.schemas).toHaveLength(3);
  });

  it("prefers the translated title for a service that exists in both languages", async () => {
    const result = await transformEnglish();

    const both = result.schemas.find((s: any) => s.id === "b753");
    expect(both.title).toBe(translated.name);
    expect(both.titleLang).toBeUndefined();
  });

  it("tags the bokmål-only services and keeps their links in the English channel", async () => {
    const result = await transformEnglish();

    const fallback = result.schemas.find((s: any) => s.id === "3b00");
    expect(fallback.titleLang).toBe("nb");
    expect(fallback.url).toBe(`/en${NB_PATH}apotekdrift/`);
  });
});
