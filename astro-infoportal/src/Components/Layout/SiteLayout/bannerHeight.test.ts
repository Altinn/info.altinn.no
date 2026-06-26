import { describe, expect, it } from "vitest";
import { sumOffsetHeights } from "./bannerHeight";

describe("sumOffsetHeights", () => {
  it("returns 0 when no banners are present", () => {
    expect(sumOffsetHeights([null, null, null])).toBe(0);
  });

  it("sums the heights of present banners", () => {
    expect(
      sumOffsetHeights([{ offsetHeight: 56 }, null, { offsetHeight: 80 }]),
    ).toBe(136);
  });

  it("ignores hidden banners (offsetHeight 0)", () => {
    expect(sumOffsetHeights([{ offsetHeight: 0 }, { offsetHeight: 64 }])).toBe(
      64,
    );
  });
});
