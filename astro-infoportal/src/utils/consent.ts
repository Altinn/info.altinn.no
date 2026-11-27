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

type SiteimproveEvent = ["event", string, "Click", string];

// Categories agreed with the analytics owner; Siteimprove reports group on them.
const FORM_LINK_CATEGORIES: ReadonlyArray<
  [selector: string, category: string]
> = [
  [".altinn-skjema-link", "start altinn form"],
  [".external-skjema-link", "link external form"],
];

/**
 * Pure: the Siteimprove event for a click on `target`, or null when it is not
 * inside a form link. The label is the page's h1, so reports name the form.
 */
export function formLinkClickEvent(
  target: EventTarget | null,
  doc: Pick<Document, "querySelector">,
): SiteimproveEvent | null {
  const element = target as Partial<Element> | null;
  if (typeof element?.closest !== "function") return null;
  const match = FORM_LINK_CATEGORIES.find(([selector]) =>
    element.closest?.(selector),
  );
  if (!match) return null;
  const label = doc.querySelector("h1")?.textContent?.trim() || "(no h1)";
  return ["event", match[1], "Click", label];
}

/**
 * Browser: report clicks on form links to Siteimprove. Delegated from the
 * document, so links rendered after this runs are covered too. Pushes only
 * once the tag has created `_sz`, which loadSiteimprove() leaves undone
 * without consent or on a URL with personal data. Returns the cleanup.
 */
export function trackFormLinkClicks(): () => void {
  if (typeof document === "undefined") return () => {};
  const onClick = (event: MouseEvent) => {
    const sz = (window as { _sz?: unknown[] })._sz;
    if (!Array.isArray(sz)) return;
    const szEvent = formLinkClickEvent(event.target, document);
    if (szEvent) sz.push(szEvent);
  };
  // Capture, so a handler that stops propagation cannot hide the click.
  document.addEventListener("click", onClick, true);
  return () => document.removeEventListener("click", onClick, true);
}
