import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OperationalMessageArchivePageTransformer } from "./OperationalMessageArchivePageTransformer";

// fetchUmbracoChildren takes (path, take, culture, sort, isPreview). Three
// transformers passed `isPreview` straight after the culture, so it landed in
// the `sort` slot: the request went out as `sort=true`, which the Delivery API
// answers with 400, and the preview headers were never sent at all. Only
// preview rendering passes a truthy isPreview, which is why it went unnoticed.
const childrenRequests: Request[] = [];

const stubFetch = () =>
  vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request(input, init);
    if (request.url.includes("fetch=children")) childrenRequests.push(request);
    return new Response(JSON.stringify({ items: [], total: 0 }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  });

const page = {
  name: "Driftsmeldinger",
  route: { path: "/om-altinn/driftsmeldinger/" },
  properties: {},
};

describe("children requests in preview mode", () => {
  beforeEach(() => {
    childrenRequests.length = 0;
    vi.stubGlobal("fetch", stubFetch());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("asks Umbraco for children without inventing a sort expression", async () => {
    await new OperationalMessageArchivePageTransformer().Transform(page, {
      locale: "nb",
      isPreview: true,
    });

    const [request] = childrenRequests;
    expect(request).toBeDefined();
    expect(new URL(request.url).searchParams.get("sort")).toBeNull();
  });

  it("forwards the preview headers to Umbraco", async () => {
    await new OperationalMessageArchivePageTransformer().Transform(page, {
      locale: "nb",
      isPreview: true,
    });

    const [request] = childrenRequests;
    expect(request.headers.get("Preview")).toBe("true");
  });
});
