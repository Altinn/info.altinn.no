import en from "@i18n/locales/en.json";
import nn from "@i18n/locales/nn.json";
import { describe, expect, it } from "vitest";
import { buildConsentBanner, buildMissingTranslationText } from "./globalData";

const full = {
  properties: {
    heading: "Får vi samle informasjon om hvordan du bruker nettsiden?",
    bodyText:
      "Hvis du svarer ja, lagrer vi informasjon til statistikk og analyse.",
    acceptLabel: "Ja",
    rejectLabel: "Nei",
    necessaryText: "Vi lagrer også nødvendig informasjon.",
    footerLinkText: "Informasjonskapsler",
    changeLinkText: "Du kan endre valget ditt når som helst.",
    changeLink: [{ route: { path: "/om-altinn/personvern/" } }],
    necessaryLinkText: "Se oversikt over nødvendig informasjon.",
    necessaryLink: [{ route: { path: "/om-altinn/personvern/" } }],
  },
};

describe("buildConsentBanner", () => {
  it("returns null when the value is missing", () => {
    expect(buildConsentBanner(null)).toBeNull();
    expect(buildConsentBanner(undefined)).toBeNull();
    expect(buildConsentBanner({})).toBeNull();
  });

  it("returns null when the footer link text is empty", () => {
    const noFooter = { properties: { ...full.properties, footerLinkText: "" } };
    expect(buildConsentBanner(noFooter)).toBeNull();
  });

  it("maps a CMS node to the footer reopen link view model", () => {
    const vm = buildConsentBanner(full);
    expect(vm).not.toBeNull();
    expect(vm?.footerLinkText).toBe("Informasjonskapsler");
  });

  it("accepts the value wrapped in an array (Delivery API shape)", () => {
    expect(buildConsentBanner([full])?.footerLinkText).toBe(
      "Informasjonskapsler",
    );
  });

  it("does not require the text fields now owned by altinn-components", () => {
    const footerOnly = {
      properties: {
        footerLinkText: "Informasjonskapsler",
      },
    };
    expect(buildConsentBanner(footerOnly)).toEqual({
      footerLinkText: "Informasjonskapsler",
    });
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
