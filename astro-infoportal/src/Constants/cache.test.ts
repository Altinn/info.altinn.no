import { describe, expect, it } from "vitest";
import { notFoundCacheControl, pageCacheControl } from "./cache";

describe("notFoundCacheControl", () => {
  it("caches 404s for a much shorter time than pages", () => {
    expect(notFoundCacheControl("info.altinn.no")).toBe(
      "public, max-age=300, s-maxage=300",
    );
    expect(pageCacheControl("info.altinn.no")).toContain("s-maxage=86400");
  });

  it("does not cache on localhost", () => {
    expect(notFoundCacheControl("localhost")).toBe("no-store");
  });
});
