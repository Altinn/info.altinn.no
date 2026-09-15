import { type Locale, t } from "@i18n/index";
import en from "@i18n/locales/en.json";
import nn from "@i18n/locales/nn.json";
import { describe, expect, it } from "vitest";
import { buildMissingTranslationText, getGlobalData } from "./globalData";

const LOCALES: Locale[] = ["nb", "nn", "en"];

// The banner is reachable again only through the footer link, and both used to
// hang off a CMS node that exists on the NB start page alone — so nn/en lost
// the banner *and* the way back to it. While the shared banner is not
// editor-controlled, neither may depend on Umbraco.
describe("consent footer link", () => {
  it.each(LOCALES)("is present with no CMS content (%s)", (locale) => {
    expect(getGlobalData(locale).footerViewModel.cookieConsent).toEqual({
      text: t("footer.cookieConsent", locale),
      url: "#informasjonskapsler",
    });
  });

  it("ignores editor-supplied text from Umbraco", () => {
    const startPage = {
      properties: {
        consentBanner: [{ properties: { footerLinkText: "Redaktørtekst" } }],
      },
    };
    const vm = getGlobalData("nb", "/sok/", undefined, {}, startPage);
    expect(vm.footerViewModel.cookieConsent.text).toBe(
      t("footer.cookieConsent", "nb"),
    );
  });
});

describe("buildMissingTranslationText", () => {
  it("returns null when the page is available in the requested language", () => {
    expect(buildMissingTranslationText("nb", "nb")).toBeNull();
    expect(buildMissingTranslationText("nn", "nn")).toBeNull();
    expect(buildMissingTranslationText("en", "en")).toBeNull();
  });

  it("explains the fallback on an english page", () => {
    expect(buildMissingTranslationText("en", "nb")).toBe(
      en["common.missingTranslation"],
    );
  });

  // Issue #648: nynorsk readers read bokmål, so the notice stays off there even
  // though nn/common.missingTranslation is still translated and ready.
  it("stays silent on a nynorsk page that fell back to bokmål", () => {
    expect(buildMissingTranslationText("nn", "nb")).toBeNull();
    expect(nn["common.missingTranslation"]).not.toBe("");
  });
});
