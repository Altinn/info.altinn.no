import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchChildrenWithNbFallback } from "./childrenWithFallback";

// Issue #705. Umbraco only returns children published in the requested culture,
// so a provider whose forms are mostly untranslated shows three services in
// bokmål and one in English. Bokmål is always the superset — no schemaPage in
// the portal has an EN variant without an NB one — so the localized list is
// completed from bokmål rather than the other way round.
const EN_PATH = "/en/forms-overview/medicines-agency/";
const NB_PATH = "/skjemaoversikt/statens-legemiddelverk/";

const child = (id: string, name: string, path: string) => ({
  id,
  name,
  contentType: "schemaPage",
  route: { path },
});

// Same node, two cultures: the id is shared, the name and path are not.
const shared = {
  en: child(
    "b753",
    "Medicinal products for animals",
    `${EN_PATH}medicinal-products/`,
  ),
  nb: child(
    "b753",
    "Unntak fra krav om markedsføringstillatelse",
    `${NB_PATH}godkjenningsfritak/`,
  ),
};
const nbOnly = [
  child("3b00", "Apotekdrift", `${NB_PATH}apotekdrift/`),
  child(
    "6e91",
    "Hente konsesjonsrapport for apotek",
    `${NB_PATH}hente-konsesjonsrapport/`,
  ),
];

const requestedPaths: string[] = [];

const stubFetch = (byPath: Record<string, unknown[]>) =>
  vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(new Request(input).url);
    const path = (url.searchParams.get("fetch") ?? "").replace("children:", "");
    requestedPaths.push(path);
    const items = byPath[path] ?? [];
    return new Response(JSON.stringify({ items, total: items.length }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  });

describe("fetchChildrenWithNbFallback", () => {
  beforeEach(() => {
    requestedPaths.length = 0;
    vi.stubGlobal(
      "fetch",
      stubFetch({
        [EN_PATH]: [shared.en],
        [NB_PATH]: [shared.nb, ...nbOnly],
      }),
    );
  });

  afterEach(() => vi.unstubAllGlobals());

  const fetchEnglish = () =>
    fetchChildrenWithNbFallback({
      localizedPath: EN_PATH,
      nbPath: NB_PATH,
      locale: "en",
    });

  it("completes the English list with the children that only exist in bokmål", async () => {
    const result = await fetchEnglish();

    expect(result.map((item) => item.id).sort()).toEqual([
      "3b00",
      "6e91",
      "b753",
    ]);
  });

  it("keeps the English version of a child that exists in both languages", async () => {
    const result = await fetchEnglish();

    const both = result.find((item) => item.id === "b753");
    expect(both?.name).toBe(shared.en.name);
    expect(both?.fallbackLocale).toBeUndefined();
  });

  it("marks the bokmål-only children so callers can tag their language", async () => {
    const result = await fetchEnglish();

    const fallback = result.filter((item) => item.fallbackLocale === "nb");
    expect(fallback.map((item) => item.name).sort()).toEqual([
      "Apotekdrift",
      "Hente konsesjonsrapport for apotek",
    ]);
  });

  // A bokmål child has no English URL. Linking to its bare path would drop the
  // reader out of the English channel; under /en/ the locale fallback serves the
  // same content with English chrome and the "not available in English" notice.
  it("keeps links to bokmål-only children inside the requested language channel", async () => {
    const result = await fetchEnglish();

    const fallback = result.find((item) => item.id === "3b00");
    expect(fallback?.route.path).toBe(`/en${NB_PATH}apotekdrift/`);
  });

  it("asks Umbraco once when the requested language is already bokmål", async () => {
    await fetchChildrenWithNbFallback({
      localizedPath: NB_PATH,
      nbPath: NB_PATH,
      locale: "nb",
    });

    expect(requestedPaths).toEqual([NB_PATH]);
  });
});
