import { describe, expect, it } from "vitest";
import { buildConsentBanner } from "./globalData";

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

  it("returns null when a mandatory field is empty (no fallback)", () => {
    const noHeading = { properties: { ...full.properties, heading: "" } };
    expect(buildConsentBanner(noHeading)).toBeNull();
    const noAccept = { properties: { ...full.properties, acceptLabel: "  " } };
    expect(buildConsentBanner(noAccept)).toBeNull();
    const noFooter = { properties: { ...full.properties, footerLinkText: "" } };
    expect(buildConsentBanner(noFooter)).toBeNull();
  });

  it("maps a complete CMS node to a view model and resolves link urls", () => {
    const vm = buildConsentBanner(full);
    expect(vm).not.toBeNull();
    expect(vm?.heading).toBe(full.properties.heading);
    expect(vm?.acceptLabel).toBe("Ja");
    expect(vm?.footerLinkText).toBe("Informasjonskapsler");
    expect(vm?.changeLinkUrl).toBe("/om-altinn/personvern/");
    expect(vm?.necessaryLinkUrl).toBe("/om-altinn/personvern/");
  });

  it("accepts the value wrapped in an array (Delivery API shape)", () => {
    expect(buildConsentBanner([full])?.heading).toBe(full.properties.heading);
  });

  it("omits optional links when their url is absent", () => {
    const noLinks = {
      properties: {
        heading: full.properties.heading,
        bodyText: full.properties.bodyText,
        acceptLabel: "Ja",
        rejectLabel: "Nei",
        necessaryText: full.properties.necessaryText,
        footerLinkText: "Informasjonskapsler",
      },
    };
    const vm = buildConsentBanner(noLinks);
    expect(vm?.changeLinkUrl).toBeUndefined();
    expect(vm?.necessaryLinkUrl).toBeUndefined();
  });
});
