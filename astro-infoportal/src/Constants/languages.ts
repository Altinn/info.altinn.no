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

const LOCALE_PREFIXES: Record<Locale, string> = {
  nb: "",
  nn: "/nn",
  en: "/en",
};

function stripLocalePrefix(path: string): string {
  const match = path.match(/^\/(nn|en)(?=\/|$)/);
  const stripped = match ? path.slice(match[0].length) : path;
  if (!stripped) return "/";
  return stripped.startsWith("/") ? stripped : `/${stripped}`;
}

/**
 * Derive the equivalent URL for `targetLocale` from the page's bokmål
 * pathname, so the locale switcher keeps the user on the same page when the
 * target locale isn't an official translation. Combined with the
 * Accept-Language fallback in `fetchUmbracoContentWithLocaleFallback`, the
 * resulting URL will render the bokmål content under the chosen locale's
 * chrome. The bokmål path is preferred as the base because nb is the
 * editorial source of truth — translated locales may use entirely different
 * slugs (e.g. `/en/help` vs `/hjelp`), so the current URL alone isn't
 * reliable when switching away from a translated page.
 */
function deriveLocaleUrl(nbPath: string, targetLocale: Locale): string {
  if (!nbPath) return LOCALE_HOME[targetLocale];
  const path = nbPath.startsWith("/") ? nbPath : `/${nbPath}`;
  const derived = `${LOCALE_PREFIXES[targetLocale]}${path}`;
  return derived || LOCALE_HOME[targetLocale];
}

export function buildMenuLanguageList(
  currentLocale: Locale,
  cultures: CultureRoutes = {},
  currentPath?: string,
) {
  const nbPath =
    cultures.nb?.path ??
    (currentPath ? stripLocalePrefix(currentPath) : undefined);

  return SUPPORTED_LOCALES.map((l) => ({
    locale: l.locale,
    pageUrl:
      cultures[l.locale]?.path ??
      (nbPath ? deriveLocaleUrl(nbPath, l.locale) : LOCALE_HOME[l.locale]),
    languageTeaser: l.languageTeaser,
    languageImage: l.languageImage,
    languageName: l.languageName,
    selected: l.locale === currentLocale,
  }));
}

// Cross-Altinn UI-language cookie value per locale (read by other Altinn apps).
export const LOCALE_TO_PERSISTENT_CONTEXT: Record<Locale, string> = {
  nb: "UL=1044",
  nn: "UL=2068",
  en: "UL=1033",
};

// Type guard for the locale literal union (narrow after validation).
export function isLocale(value: unknown): value is Locale {
  return value === "nb" || value === "nn" || value === "en";
}

// Profile language → site locale (profile stores nb/nn/en; fallback nb).
export function resolveLocale(value?: string | null): Locale {
  return isLocale(value) ? value : "nb";
}

export function detectLocaleFromPath(path: string): Locale {
  if (path === "/nn" || path.startsWith("/nn/")) return "nn";
  if (path === "/en" || path.startsWith("/en/")) return "en";
  return "nb";
}

const SEARCH_SLUGS: Record<Locale, string> = {
  nb: "/sok/",
  nn: "/nn/sok/",
  en: "/en/search/",
};

type LocaleMenuEntry = { locale: Locale; pageUrl: string };

// Navigate to the same page in another locale (CMS pageUrls + search slugs).
export function navigateToLocale(
  targetLocale: Locale,
  menuLanguageList: LocaleMenuEntry[] | undefined,
  currentPath: string,
): boolean {
  const searchSlugSet = new Set(
    Object.values(SEARCH_SLUGS).flatMap((s) => [s, s.replace(/\/$/, "")]),
  );
  const target = searchSlugSet.has(currentPath)
    ? SEARCH_SLUGS[targetLocale]
    : menuLanguageList?.find((l) => l.locale === targetLocale)?.pageUrl;

  // Relative same-origin only (open-redirect guard).
  if (!target || /^[a-z]+:/i.test(target) || target.startsWith("//")) {
    return false;
  }
  if (typeof window !== "undefined") {
    window.location.assign(target);
  }
  return true;
}
