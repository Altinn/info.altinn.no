const LEGACY_CONSENT_COOKIE_NAME = "infoportal-consent";

// URL hash that reopens the banner on direct visits and as a fallback href.
export const CONSENT_REOPEN_HASH = "informasjonskapsler";

const SITEIMPROVE_SRC =
  "https://siteimproveanalytics.com/js/siteanalyze_6255470.js";

/** Browser: expire the superseded host-only consent cookie from the old banner. */
export function deleteLegacyConsentCookie(): void {
  if (typeof document === "undefined") return;
  const secure = document.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${LEGACY_CONSENT_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}

// Personal-data patterns for the Siteimprove URL guard: emails and long digit
// runs (fødselsnummer / organisasjonsnummer). Module-scope so they compile once;
// no /g flag — we only test for presence, so a stateful lastIndex never applies.
const PERSONAL_DATA_EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const PERSONAL_DATA_LONG_NUMBER = /\d(?:\d|\D\d){5,}/;

/**
 * Pure: does the query string look free of personal data? Mirrors the legacy
 * portal rule — never report a URL whose query carries emails or long digit runs
 * (fødselsnummer / organisasjonsnummer) to Siteimprove. Returns true when safe.
 */
export function searchHasNoPersonalData(search: string): boolean {
  let decoded: string;
  try {
    decoded = decodeURIComponent(search);
  } catch {
    return false; // malformed query — be safe and skip analytics
  }
  return (
    !PERSONAL_DATA_EMAIL.test(decoded) && !PERSONAL_DATA_LONG_NUMBER.test(decoded)
  );
}

/**
 * Browser: inject the Siteimprove tag once (idempotent). Consent is owned by
 * @altinn/altinn-components/useConsent; this helper only applies the local
 * personal-data URL guard before loading analytics.
 */
export function loadSiteimprove(): void {
  if (typeof document === "undefined") return;
  if (
    typeof window !== "undefined" &&
    !searchHasNoPersonalData(window.location.search)
  ) {
    return;
  }
  if (document.querySelector("script[data-siteimprove]")) return;
  const tag = document.createElement("script");
  tag.src = SITEIMPROVE_SRC;
  tag.defer = true;
  tag.dataset.siteimprove = "true";
  document.head.appendChild(tag);
}
