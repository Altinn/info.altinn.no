import nb from "./locales/nb.json";
import nn from "./locales/nn.json";
import en from "./locales/en.json";

export type Locale = "nb" | "nn" | "en";
export type TranslationKey = keyof typeof nb;

const locales: Record<Locale, Record<string, string>> = { nb, nn, en };

export function t(key: TranslationKey, locale: Locale = "nb"): string {
  return locales[locale]?.[key] ?? locales.nb[key] ?? key;
}
