const HELP_PAGE_CONTENT_TYPES = new Set([
  "helpLandingPage",
  "helpDrilldownPage",
  "helpStartPage",
  "helpQuestionPage",
  "helpProcessArticlePage",
  "helpSearchPage",
]);

export function isHelpPageType(contentType: string | undefined): boolean {
  return contentType ? HELP_PAGE_CONTENT_TYPES.has(contentType) : false;
}

// Resolves the route path of an Umbraco MultiNodeTreePicker value.
// The Delivery API serializes picked content as an array of items with { route: { path } }.
export function resolvePickerUrl(pickerValue: unknown): string | null {
  if (!pickerValue) return null;
  const first = Array.isArray(pickerValue) ? pickerValue[0] : pickerValue;
  const path = (first as { route?: { path?: string } })?.route?.path;
  return path ?? null;
}

export function buildLink(
  pickerValue: unknown,
  text: string,
): { text: string; url: string } | null {
  const url = resolvePickerUrl(pickerValue);
  if (!url) return null;
  return { text, url };
}

// Simple 64-bit FNV-1a hash, rendered as hex. Used to version banner dismissal:
// when the message changes, the hash changes, so users see the new banner.
function hashMessage(html: string): string {
  let h = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  const mask = 0xffffffffffffffffn;
  for (let i = 0; i < html.length; i++) {
    h = ((h ^ BigInt(html.charCodeAt(i))) * prime) & mask;
  }
  return h.toString(16).padStart(16, "0");
}

// "Banner Color" dropdown labels → Designsystemet roles (BannerBlock.scss keys on these).
const BANNER_COLOR_BY_LABEL: Record<string, string> = {
  "blå": "accent",
  "lyseblå": "info",
  "grønn": "success",
  gul: "warning",
  "rød": "danger",
};

// `message` arrives pre-shaped as { items: [...] } from the backend RichText converter.
export function buildBanner(bannerValue: unknown, closeButtonText: string) {
  const first = Array.isArray(bannerValue) ? bannerValue[0] : bannerValue;
  const props = (first as { properties?: Record<string, unknown> } | null | undefined)
    ?.properties;
  if (!props) return null;

  const messageItems = (props.message as { items?: unknown[] } | undefined)?.items;
  if (!Array.isArray(messageItems) || messageItems.length === 0) return null;

  const html = messageItems
    .map((item) => (item as { html?: string })?.html ?? "")
    .join("");
  if (!html) return null;

  return {
    message: { items: messageItems, componentName: "RichTextArea" },
    isActive: Boolean(props.isActive),
    badgeText: (props.badgeText as string) ?? "",
    colorTheme:
      BANNER_COLOR_BY_LABEL[
        ((props.colorTheme as string) ?? "").trim().toLowerCase()
      ] ?? "accent",
    closeButtonText,
    contentHash: hashMessage(html),
    localStoragePrefix: "infoportal-banner-dismissed",
    componentName: "BannerBlock",
  };
}
