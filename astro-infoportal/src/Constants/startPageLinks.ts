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

type RichTextValue = string | { markup?: string } | undefined | null;

function resolveRichText(value: RichTextValue): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  return value.markup ?? null;
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

export function buildBanner(pickerValue: unknown, closeButtonText: string) {
  if (!pickerValue) return null;
  const first = Array.isArray(pickerValue) ? pickerValue[0] : pickerValue;
  const props = (first as { properties?: Record<string, unknown> })?.properties;
  if (!props) return null;

  const html = resolveRichText(props.message as RichTextValue);
  if (!html) return null;

  return {
    message: {
      items: [{ html, componentName: "RichText" }],
      componentName: "RichTextArea",
    },
    isActive: Boolean(props.isActive),
    badgeText: (props.badgeText as string) ?? "",
    colorTheme: (props.colorTheme as string) ?? "accent",
    closeButtonText,
    contentHash: hashMessage(html),
    localStoragePrefix: "infoportal-banner-dismissed",
    componentName: "BannerBlock",
  };
}
