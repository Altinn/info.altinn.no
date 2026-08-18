import { describe, expect, it } from "vitest";
import en from "./locales/en.json";
import nb from "./locales/nb.json";
import nn from "./locales/nn.json";

// `t()` falls back to nb for any key a locale is missing, so a gap here is
// invisible at runtime — it just renders bokmål on a nynorsk/english page.
// This is how issue #549 shipped, so the parity check is the regression guard.
const nbKeys = Object.keys(nb).sort();

describe("locale key parity", () => {
  it.each([
    ["nn", nn],
    ["en", en],
  ])("%s defines every key nb defines", (_locale, translations) => {
    expect(Object.keys(translations).sort()).toEqual(nbKeys);
  });

  it.each([
    ["nb", nb],
    ["nn", nn],
    ["en", en],
  ])("%s has no blank values", (_locale, translations) => {
    const blank = Object.entries(translations)
      .filter(([, value]) => value.trim() === "")
      .map(([key]) => key);
    expect(blank).toEqual([]);
  });
});
