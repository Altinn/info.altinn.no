import { describe, expect, it } from "vitest";
import { CSP_POLICY } from "./csp";

/**
 * The policy is enforcing in production, so a missing origin does not degrade
 * gracefully — the resource is blocked outright. These assertions pin the
 * third-party origins we depend on so removing one fails here, not at runtime.
 */
describe("CSP_POLICY", () => {
  const directive = (name: string): string => {
    const found = CSP_POLICY.split("; ").find((part) =>
      part.startsWith(`${name} `),
    );
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
});
