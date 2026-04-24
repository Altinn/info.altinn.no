import type { Locale } from "@i18n/index";

type LanguageMeta = {
  locale: Locale;
  languageName: string;
  languageTeaser: string;
  languageImage: string;
};

// languageName and languageTeaser are each expressed in their own language
// (Nynorsk is labelled "Nynorsk" even to a Bokmål reader), so they are not t()-driven.
export const SUPPORTED_LOCALES: readonly LanguageMeta[] = [
  {
    locale: "nb",
    languageName: "Bokmål",
    languageTeaser: "Alt innhold er tilgjengelig på bokmål.",
    languageImage: "/Static/img/no.svg",
  },
  {
    locale: "nn",
    languageName: "Nynorsk",
    languageTeaser: "Noko av innhaldet er tilgjengeleg på nynorsk.",
    languageImage: "/Static/img/no.svg",
  },
  {
    locale: "en",
    languageName: "English",
    languageTeaser: "Some content is available in English.",
    languageImage: "/Static/img/gb.svg",
  },
];

const LOCALE_HOME: Record<Locale, string> = {
  nb: "/",
  nn: "/nn/",
  en: "/en/",
};

export type CultureRoute = { path: string };
export type CultureRoutes = Partial<Record<Locale, CultureRoute>>;

export function buildMenuLanguageList(
  currentLocale: Locale,
  cultures: CultureRoutes = {},
) {
  return SUPPORTED_LOCALES.map((l) => ({
    pageUrl: cultures[l.locale]?.path ?? LOCALE_HOME[l.locale],
    languageTeaser: l.languageTeaser,
    languageImage: l.languageImage,
    languageName: l.languageName,
    selected: l.locale === currentLocale,
  }));
}
