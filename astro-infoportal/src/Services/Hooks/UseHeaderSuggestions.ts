import { useMemo, useRef, useCallback } from "react";
import { createSearchApi } from "../API/SearchClient";
import type { SearchSuggestionCollection } from "/Models/Local/SearchSuggestionCollection";

function resolveLang(explicit?: string): string {
  if (explicit && explicit.trim()) return explicit.split("-")[0].toLowerCase();

  if (typeof document !== "undefined") {
    const htmlLang = document.documentElement?.lang;
    if (htmlLang) return htmlLang.split("-")[0].toLowerCase();
  }

  if (typeof navigator !== "undefined") {
    const nav = navigator.language || (navigator as any).userLanguage;
    if (nav) return String(nav).split("-")[0].toLowerCase();
  }

  try {
    const intl = Intl.DateTimeFormat().resolvedOptions().locale;
    if (intl) return intl.split("-")[0].toLowerCase();
  } catch {
    /* ignore */
  }

  return "en";
}

const EMPTY: SearchSuggestionCollection = { suggestions: [], totalHits: 0 };

export function useHeaderSuggestions(language?: string) {
  const lang = resolveLang(language);

  const api = useMemo(() => createSearchApi(lang), [lang]);
  const inFlight = useRef<AbortController | null>(null);

  const getSuggestions = useCallback(
    async (query: string): Promise<SearchSuggestionCollection> => {
      const q = (query || "").trim();
      if (q.length < 2) return EMPTY;

      if (inFlight.current?.abort) inFlight.current.abort();

      const controller =
        typeof AbortController !== "undefined"
          ? new AbortController()
          : (null as any);

      inFlight.current = controller ?? null;

      try {
        const result = await api.getSuggestions(q, controller?.signal);
        if (!result) return EMPTY;
        const { suggestions, totalHits } = result as SearchSuggestionCollection;
        if (!Array.isArray(suggestions)) return EMPTY;
        return {
          suggestions,
          totalHits: Number(totalHits) || suggestions.length,
        };
      } catch (err: any) {
        if (err?.name === "AbortError") return EMPTY;
        // eslint-disable-next-line no-console
        console.error("getSuggestions error", err);
        return EMPTY;
      } finally {
        inFlight.current = null;
      }
    },
    [api]
  );

  return { getSuggestions };
}
