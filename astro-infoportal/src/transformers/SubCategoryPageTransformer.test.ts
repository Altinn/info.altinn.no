import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SubCategoryPageTransformer } from "./SubCategoryPageTransformer";

// Unlike the provider page, a subcategory lists its services through a related
// query that always runs in bokmål, so no service goes missing here (issue
// #705). What happens instead is that each service is then fetched by id in the
// requested language: an untranslated one 404s, the client retries in bokmål,
// and the row ends up with a Norwegian title and a bokmål URL on an English
// page — untagged for screen readers, and a link out of the English channel.
const SCHEMA_ID = "5511ce88";
const NB_SCHEMA_PATH = "/skjemaoversikt/nkom/registreringsskjema/";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const stubFetch = () =>
  vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request(input, init);
    const url = new URL(request.url);
    const culture = request.headers.get("Accept-Language");

    // Altinn org registry, used for provider emblems.
    if (!url.pathname.startsWith("/umbraco")) return json({ orgs: {} });

    if (url.pathname.includes("/content/item/")) {
      // The service exists only in bokmål: 404 in English, found in bokmål.
      if (culture !== "nb") return json({}, 404);
      return json({
        id: SCHEMA_ID,
        name: "Registreringsskjema for sertifikatklasse Person",
        route: { path: NB_SCHEMA_PATH },
        properties: { schemaCode: "NK-001" },
      });
    }

    const fetchParam = url.searchParams.get("fetch") ?? "";
    if (fetchParam.startsWith("descendants:")) {
      return json({
        items: [
          {
            id: SCHEMA_ID,
            name: "Registreringsskjema for sertifikatklasse Person",
            contentType: "schemaPage",
            route: { path: NB_SCHEMA_PATH },
          },
        ],
        total: 1,
      });
    }

    return json({ items: [], total: 0 });
  });

const page = {
  id: "sub-1",
  name: "Sertifikater",
  route: { path: "/en/forms-overview/category/certificates/" },
  properties: {},
};

const transformEnglish = () =>
  new SubCategoryPageTransformer().Transform(page, {
    locale: "en",
    contentLocale: "en",
  });

describe("SubCategoryPageTransformer language fallback", () => {
  beforeEach(() => vi.stubGlobal("fetch", stubFetch()));
  afterEach(() => vi.unstubAllGlobals());

  it("marks a service that came back in bokmål so its title can be tagged", async () => {
    const result = await transformEnglish();

    expect(result.schemas[0].titleLang).toBe("nb");
  });

  it("keeps the link to an untranslated service inside the English channel", async () => {
    const result = await transformEnglish();

    expect(result.schemas[0].url).toBe(`/en${NB_SCHEMA_PATH}`);
  });
});
