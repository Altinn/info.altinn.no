export type LegacyLocale = "nb" | "nn" | "en";

// "no" is the legacy alias for "nb".
const LEGACY_LOCALE_MAP: Record<string, LegacyLocale> = {
  no: "nb",
  nb: "nb",
  nn: "nn",
  en: "en",
};

export function normalizeLegacyLocale(
  lang: string | undefined,
): LegacyLocale | null {
  if (!lang) return null;
  return LEGACY_LOCALE_MAP[lang.toLowerCase()] ?? null;
}
