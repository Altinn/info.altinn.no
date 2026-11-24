import { describe, expect, it } from "vitest";
import { notFoundCacheControl } from "./cache";

describe("notFoundCacheControl", () => {
  it("caches 404s for five minutes", () => {
    expect(notFoundCacheControl("info.altinn.no")).toBe(
      "public, max-age=300, s-maxage=300",
    );
  });

  it("does not cache on localhost", () => {
    expect(notFoundCacheControl("localhost")).toBe("no-store");
  });
});
