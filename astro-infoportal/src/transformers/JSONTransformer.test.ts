import { describe, expect, it } from "vitest";
import type { Locale } from "@i18n/index";
import { JSONTransformer } from "./JSONTransformer";

const LOCALES: Locale[] = ["nb", "nn", "en"];

// SiteLayout hands `locale` to RootProvider, and every altinn-components
// component resolves its texts from that context. The transformer read
// globalData.locale for t() but never forwarded it, so the value never reached
// the island: PR #768 wired RootProvider correctly and still had no effect, and
// SkyraSurvey skipped skyra.setLanguage() entirely on the undefined code.
describe("JSONTransformer", () => {
  it.each(LOCALES)("forwards locale %s to the SiteLayout props", async (locale) => {
    const data = await new JSONTransformer().Transform(null, { locale });
    expect(data.locale).toBe(locale);
  });

  it("leaves locale undefined when globalData carries none", async () => {
    const data = await new JSONTransformer().Transform(null, {});
    expect(data.locale).toBeUndefined();
  });

  // Issue #713: SiteLayout compares the two to decide whether the chrome and
  // the content need separate lang attributes. Without the forward it only ever
  // sees `locale`, and every page looks translated.
  it("forwards contentLocale to the SiteLayout props", async () => {
    const data = await new JSONTransformer().Transform(null, {
      locale: "en",
      contentLocale: "nb",
    });
    expect(data.contentLocale).toBe("nb");
  });
});
