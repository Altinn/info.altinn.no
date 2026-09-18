import type { Locale } from "@i18n/index";
import { createContext, type ReactNode, useContext } from "react";

/**
 * The language the interface is written in, but only when that differs from the
 * language of the content around it (issue #713).
 *
 * A page with no variant in the requested language renders bokmål content, and
 * `<html lang>` follows that content. The interface strings inside it — button
 * labels, accordion headings, "no hits" — are still English or nynorsk, so they
 * sit in a region marked as bokmål and a screen reader reads them with the wrong
 * phonetics (WCAG 3.1.2). The value is undefined on every properly translated
 * page, where the interface and the content already share a language and there
 * is nothing to mark.
 *
 * Transformers cannot solve this themselves: their output is serialized as JSON
 * into the Astro island, so they can pass data but never markup. They emit the
 * strings; this tells the components how to render them.
 */
const UiLanguageContext = createContext<Locale | undefined>(undefined);

export const UiLanguageProvider = ({
  lang,
  children,
}: {
  lang: Locale | undefined;
  children: ReactNode;
}) => (
  <UiLanguageContext.Provider value={lang}>
    {children}
  </UiLanguageContext.Provider>
);

/**
 * For components that already render an element of their own and can carry the
 * attribute directly, rather than paying for a wrapper span.
 */
export const useUiLanguage = (): Locale | undefined =>
  useContext(UiLanguageContext);

/** Marks interface text, and renders nothing extra when there is no fallback. */
export const UiText = ({ children }: { children: ReactNode }) => {
  const lang = useUiLanguage();
  if (!lang) return <>{children}</>;
  return <span lang={lang}>{children}</span>;
};
