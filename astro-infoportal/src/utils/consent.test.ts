import { describe, expect, it } from "vitest";
import {
  CONSENT_VERSION,
  needsPrompt,
  parseConsent,
  searchHasNoPersonalData,
  serializeConsentValue,
  shouldLoadSiteimprove,
} from "./consent";

describe("searchHasNoPersonalData", () => {
  it("is true for a clean query string", () => {
    expect(searchHasNoPersonalData("?q=skatt")).toBe(true);
    expect(searchHasNoPersonalData("")).toBe(true);
  });

  it("is false when the query contains an email", () => {
    expect(searchHasNoPersonalData("?email=ola%40example.com")).toBe(false);
  });

  it("is false when the query contains a long digit run (fødselsnummer)", () => {
    expect(searchHasNoPersonalData("?q=12345678901")).toBe(false);
  });

  it("is false for a malformed query that cannot be decoded", () => {
    expect(searchHasNoPersonalData("?q=%E0%A4%A")).toBe(false);
  });
});

describe("parseConsent", () => {
  it("returns an undecided state when the cookie is absent", () => {
    const s = parseConsent("other=1; foo=bar");
    expect(s.decided).toBe(false);
    expect(s.statistics).toBe(false);
  });

  it("parses a granted decision", () => {
    const s = parseConsent(`infoportal-consent=v=1%26statistics%3Dgranted`);
    expect(s).toEqual({ decided: true, statistics: true, version: 1 });
  });

  it("parses a denied decision", () => {
    const s = parseConsent(`infoportal-consent=v=1%26statistics%3Ddenied`);
    expect(s).toEqual({ decided: true, statistics: false, version: 1 });
  });

  it("treats a malformed value as undecided", () => {
    expect(parseConsent("infoportal-consent=garbage").decided).toBe(false);
  });

  it("does not throw on a value with invalid percent-encoding", () => {
    expect(parseConsent("infoportal-consent=%E0%A4%A").decided).toBe(false);
  });
});

describe("serializeConsentValue", () => {
  it("encodes the current version and the grant flag", () => {
    expect(serializeConsentValue(true)).toBe(
      `v=${CONSENT_VERSION}&statistics=granted`,
    );
    expect(serializeConsentValue(false)).toBe(
      `v=${CONSENT_VERSION}&statistics=denied`,
    );
  });
});

describe("shouldLoadSiteimprove", () => {
  it("is true only for a current-version granted decision", () => {
    expect(
      shouldLoadSiteimprove({
        decided: true,
        statistics: true,
        version: CONSENT_VERSION,
      }),
    ).toBe(true);
    expect(
      shouldLoadSiteimprove({
        decided: true,
        statistics: false,
        version: CONSENT_VERSION,
      }),
    ).toBe(false);
    expect(
      shouldLoadSiteimprove({ decided: false, statistics: false, version: 0 }),
    ).toBe(false);
    expect(
      shouldLoadSiteimprove({
        decided: true,
        statistics: true,
        version: CONSENT_VERSION - 1,
      }),
    ).toBe(false);
  });
});

describe("needsPrompt", () => {
  it("prompts when undecided or on an older version", () => {
    expect(needsPrompt({ decided: false, statistics: false, version: 0 })).toBe(
      true,
    );
    expect(
      needsPrompt({
        decided: true,
        statistics: false,
        version: CONSENT_VERSION - 1,
      }),
    ).toBe(true);
    expect(
      needsPrompt({
        decided: true,
        statistics: true,
        version: CONSENT_VERSION,
      }),
    ).toBe(false);
    expect(
      needsPrompt({
        decided: true,
        statistics: false,
        version: CONSENT_VERSION,
      }),
    ).toBe(false);
  });
});
