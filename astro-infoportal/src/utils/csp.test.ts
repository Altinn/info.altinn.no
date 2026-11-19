import { describe, expect, it } from "vitest";
import {
  CSP_POLICY,
  isPreviewPath,
  PREVIEW_CSP_POLICY,
  PREVIEW_FRAME_ANCESTORS,
} from "./csp";

/**
 * The policy is enforcing in production, so a missing origin does not degrade
 * gracefully — the resource is blocked outright. These assertions pin the
 * third-party origins we depend on so removing one fails here, not at runtime.
 */
describe("CSP_POLICY", () => {
  const directive = (name: string, policy = CSP_POLICY): string => {
    const found = policy
      .split("; ")
      .find((part) => part.startsWith(`${name} `));
    if (!found) throw new Error(`no ${name} directive in policy`);
    return found;
  };

  it("allows the jsDelivr-hosted Skyra SDK in script-src", () => {
    expect(directive("script-src")).toContain("https://cdn.jsdelivr.net");
  });

  it("allows the Skyra ingest endpoint in connect-src", () => {
    expect(directive("connect-src")).toContain("https://ingest.skyra.no");
  });

  it("keeps the pre-existing third-party origins", () => {
    expect(directive("script-src")).toContain(
      "https://siteimproveanalytics.com",
    );
    expect(directive("connect-src")).toContain(
      "https://*.siteimproveanalytics.io",
    );
  });

  it("still defaults to self", () => {
    expect(directive("default-src")).toBe("default-src 'self'");
  });

  it("only lets the site itself frame ordinary pages", () => {
    expect(directive("frame-ancestors")).toBe("frame-ancestors 'self'");
  });
});

describe("PREVIEW_CSP_POLICY", () => {
  const directives = (policy: string) => policy.split("; ");

  it("lets the Umbraco backoffice frame /preview", () => {
    const frameAncestors = directives(PREVIEW_CSP_POLICY).find((d) =>
      d.startsWith("frame-ancestors "),
    );
    expect(frameAncestors).toContain("'self'");
    expect(frameAncestors).toContain("https://cms.prod.altinn.no");
    for (const origin of PREVIEW_FRAME_ANCESTORS) {
      expect(frameAncestors).toContain(origin);
    }
  });

  it("is otherwise identical to the ordinary policy", () => {
    const withoutFrameAncestors = (policy: string) =>
      directives(policy).filter((d) => !d.startsWith("frame-ancestors "));
    expect(withoutFrameAncestors(PREVIEW_CSP_POLICY)).toEqual(
      withoutFrameAncestors(CSP_POLICY),
    );
  });
});

describe("isPreviewPath", () => {
  it("matches the preview page only", () => {
    expect(isPreviewPath("/preview")).toBe(true);
    expect(isPreviewPath("/preview/")).toBe(true);
    expect(isPreviewPath("/")).toBe(false);
    expect(isPreviewPath("/preview-something")).toBe(false);
    expect(isPreviewPath("/nb/preview")).toBe(false);
  });
});
