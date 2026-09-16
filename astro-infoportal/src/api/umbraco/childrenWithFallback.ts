import type { Locale } from "@i18n/index";
import { fetchUmbracoChildren } from "./client";

export type ChildWithFallback = Record<string, any> & {
  /** Set when the child exists only in bokmål and was served from there. */
  fallbackLocale?: Locale;
};

/**
 * Whether a piece of content came back in bokmål instead of the language asked
 * for. The Delivery API gives every culture its own route (`/en/forms-overview/…`
 * vs `/skjemaoversikt/…`), so an unprefixed path is the tell — which also catches
 * the silent NB retries inside `fetchUmbracoChildren` and `fetchUmbracoContentById`.
 */
export function fallbackLocaleFor(
  routePath: string | undefined,
  locale: Locale,
): Locale | undefined {
  if (locale === "nb") return undefined;
  return routePath?.startsWith(`/${locale}/`) ? undefined : "nb";
}

/**
 * Keeps a link inside the language channel the reader is browsing. Bokmål-only
 * content has no localized route, and its bare path would navigate out of
 * `/en/`; under the prefix the locale fallback serves the same content with
 * localized chrome and the "not available in English" notice (issue #648).
 */
export function localeChannelPath(
  routePath: string | undefined,
  locale: Locale,
): string {
  const path = routePath ?? "";
  if (!fallbackLocaleFor(path, locale)) return path;
  return `/${locale}${path}`;
}

/**
 * Children of `localizedPath`, completed from the bokmål tree (issue #705).
 *
 * The Delivery API only returns children published in the requested culture, so
 * a provider whose services are mostly untranslated lists three forms in bokmål
 * and one in English. Editorially the forms catalogue is meant to be complete in
 * every language channel — a reader must be able to find a mandatory form even
 * when nobody has translated it yet — so the localized list is completed from
 * bokmål. Bokmål is always the superset; no schemaPage has an EN or NN variant
 * without an NB one.
 *
 * Merged-in children are marked with `fallbackLocale` so callers can tag their
 * language for screen readers (issue #713), and their links are rewritten into
 * the requested language channel: the bare bokmål path would drop the reader out
 * of it, while under `/en/` the locale fallback serves the same content with
 * localized chrome and the "not available in English" notice.
 */
export async function fetchChildrenWithNbFallback({
  localizedPath,
  nbPath,
  take = 100,
  locale,
  isPreview,
}: {
  localizedPath: string;
  nbPath?: string;
  take?: number;
  locale: Locale;
  isPreview?: boolean;
}): Promise<ChildWithFallback[]> {
  const localized: ChildWithFallback[] = await fetchUmbracoChildren(
    localizedPath,
    take,
    locale,
    { isPreview },
  );

  if (locale === "nb" || !nbPath) return localized;

  const fromNb: ChildWithFallback[] = await fetchUmbracoChildren(
    nbPath,
    take,
    "nb",
    { isPreview },
  );

  const seen = new Set(localized.map((child) => child.id));
  const missing = fromNb.filter((child) => !seen.has(child.id));

  // `localized` is mapped too, not just `missing`: when the localized list comes
  // back empty, fetchUmbracoChildren silently retries in bokmål, and those items
  // need marking just as much as the ones merged in here.
  return [...localized, ...missing].map((child) => {
    const fallbackLocale = fallbackLocaleFor(child.route?.path, locale);
    if (!fallbackLocale) return child;
    return {
      ...child,
      fallbackLocale,
      route: {
        ...child.route,
        path: localeChannelPath(child.route?.path, locale),
      },
    };
  });
}
