import {describe, expect, it} from "vitest";
import {buildBanner} from "./startPageLinks";

const makeBanner = (overrides: Record<string, unknown> = {}) => [
  {
    properties: {
      isActive: true,
      badgeText: "Nyhet",
      colorTheme: "lyseblå",
      message: {
        items: [{html: "<p>Altinn er fornyet. <a href='/x'>Les mer</a></p>"}],
      },
      ...overrides,
    },
  },
];

describe("buildBanner", () => {
  it("returns null when there is no banner value", () => {
    expect(buildBanner(null, "Lukk")).toBeNull();
    expect(buildBanner(undefined, "Lukk")).toBeNull();
    expect(buildBanner([], "Lukk")).toBeNull();
  });

  it("returns null when the message has no items", () => {
    expect(buildBanner(makeBanner({message: {items: []}}), "Lukk")).toBeNull();
  });

  it("maps a valid banner to the BannerBlock view model", () => {
    const result = buildBanner(makeBanner(), "Lukk");
    expect(result).toMatchObject({
      isActive: true,
      badgeText: "Nyhet",
      variant: "strong",
      closeButtonText: "Lukk",
      localStoragePrefix: "infoportal-banner-dismissed",
      componentName: "BannerBlock",
      message: {componentName: "RichTextArea"},
    });
    expect(result?.message.items).toHaveLength(1);
    expect(result?.contentHash).toMatch(/^[0-9a-f]{16}$/);
  });

  it("does not emit a colorTheme (banner color is fixed to the strong variant)", () => {
    expect(buildBanner(makeBanner(), "Lukk")).not.toHaveProperty("colorTheme");
  });

  it("coerces isActive to a boolean and defaults badgeText to empty string", () => {
    const result = buildBanner(
      makeBanner({isActive: undefined, badgeText: undefined}),
      "Lukk",
    );
    expect(result?.isActive).toBe(false);
    expect(result?.badgeText).toBe("");
  });

  it("produces a different contentHash when the message changes", () => {
    const a = buildBanner(makeBanner(), "Lukk");
    const b = buildBanner(
      makeBanner({message: {items: [{html: "<p>Annen melding</p>"}]}}),
      "Lukk",
    );
    expect(a?.contentHash).not.toEqual(b?.contentHash);
  });
});
