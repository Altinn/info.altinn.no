// Consent for non-essential storage on the info portal. Statistics = Siteimprove.
// Bump CONSENT_VERSION only when the SCOPE of consent changes (e.g. a new
// category) — never for wording fixes — so users are re-prompted only when the
// thing they consented to actually changed.
export const CONSENT_COOKIE = "infoportal-consent";
export const CONSENT_VERSION = 1;

// URL hash that reopens the banner (footer link / personvern page / any
// [data-consent-reopen] element). Shared so the click-listener, the hash-on-load
// check, and the footer link all reference one value.
export const CONSENT_REOPEN_HASH = "informasjonskapsler";

const SITEIMPROVE_SRC =
  "https://siteimproveanalytics.com/js/siteanalyze_6255470.js";

export type ConsentState = {
  decided: boolean;
  statistics: boolean;
  version: number;
};

// Frozen so a caller that mutates a returned state can't corrupt the shared singleton.
const UNDECIDED: ConsentState = Object.freeze({
  decided: false,
  statistics: false,
  version: 0,
});

function readRawCookie(cookieString: string, name: string): string | null {
  for (const part of cookieString ? cookieString.split(";") : []) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) {
      try {
        return decodeURIComponent(part.slice(eq + 1).trim());
      } catch {
        return null; // malformed percent-encoding → treat as no decision
      }
    }
  }
  return null;
}

/** Pure: derive consent state from a raw `document.cookie` string. */
export function parseConsent(cookieString: string): ConsentState {
  const raw = readRawCookie(cookieString, CONSENT_COOKIE);
  if (!raw) return UNDECIDED;
  const params = new URLSearchParams(raw);
  const version = Number.parseInt(params.get("v") ?? "", 10);
  const statistics = params.get("statistics");
  if (
    !Number.isFinite(version) ||
    (statistics !== "granted" && statistics !== "denied")
  ) {
    return UNDECIDED;
  }
  return { decided: true, statistics: statistics === "granted", version };
}

/** Pure: the cookie value for a decision. */
export function serializeConsentValue(statistics: boolean): string {
  return `v=${CONSENT_VERSION}&statistics=${statistics ? "granted" : "denied"}`;
}

/** Pure: may Siteimprove load? Only a current-version granted decision. */
export function shouldLoadSiteimprove(state: ConsentState): boolean {
  return state.decided && state.statistics && state.version === CONSENT_VERSION;
}

/** Pure: should the banner be shown (no decision yet, or scope changed)? */
export function needsPrompt(state: ConsentState): boolean {
  return !state.decided || state.version < CONSENT_VERSION;
}

/** Browser: current consent from the document cookie. */
export function readConsent(): ConsentState {
  if (typeof document === "undefined") return UNDECIDED;
  return parseConsent(document.cookie);
}

/** Browser: persist a decision for 12 months on the info host. */
export function writeConsent(statistics: boolean): void {
  if (typeof document === "undefined") return;
  const secure =
    typeof location !== "undefined" && location.protocol === "https:"
      ? "; Secure"
      : "";
  document.cookie =
    `${CONSENT_COOKIE}=${encodeURIComponent(serializeConsentValue(statistics))}` +
    `; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
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
 * Browser: inject the Siteimprove tag once (idempotent). Self-gates on BOTH
 * consent and the personal-data URL check, so no caller (head bundle, banner
 * accept handler, or any future one) can load analytics without a current-version
 * granted decision, and never on a URL whose query looks like it carries PII.
 */
export function loadSiteimprove(): void {
  if (typeof document === "undefined") return;
  // Consent gate (defense-in-depth) — independent of how this is called.
  if (!shouldLoadSiteimprove(readConsent())) return;
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
