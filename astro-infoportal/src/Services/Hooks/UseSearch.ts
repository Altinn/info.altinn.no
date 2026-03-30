import type { FilterState } from "@altinn/altinn-components";
import { usePagination } from "@digdir/designsystemet-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { createSearchApi } from "../API/SearchClient";

type BrowserQueryState = {
  query?: string;
  pageNumber?: number;
  context?: string;
};

type UsePaginationReturn = ReturnType<typeof usePagination>;

const isBrowser =
  typeof location !== "undefined" && typeof history !== "undefined";

function buildBrowserParams(state: BrowserQueryState) {
  const searchParams = new URLSearchParams();
  if (!state.query || state.query.trim() === "") return searchParams.toString();

  searchParams.set("q", state.query);
  if (state.context) {
    searchParams.set("context", state.context);
  }
  return searchParams.toString();
}

export type UseSearchPageOptions = {
  language: string;
  query: string;
  currentContext: string;
  initialPageNumber?: number;
  providerFacets: any[];
  pageTypeFacets: any[];
  initialResults?: any | null;
  pageSize?: number;
  maxPaginationButtons?: number;
};

export type UseSearchPageReturn = {
  items: any["items"];
  loading: boolean;
  error: Error | null;
  hasNoResults: boolean;

  pageNumber: number;

  filters: FilterState;
  applyFilters: (next: FilterState) => void;

  totalItems: number;
  calculatedTotalPages: number;

  pages: UsePaginationReturn["pages"];
  prevButtonProps: UsePaginationReturn["prevButtonProps"];
  nextButtonProps: UsePaginationReturn["nextButtonProps"];
  providerLabelByValue?: Record<string, string>;
  pageTypeLabelByValue?: Record<string, string>;
};

export function useSearchPage(
  options: UseSearchPageOptions,
): UseSearchPageReturn {
  const {
    language,
    query,
    initialPageNumber = 1,
    currentContext,
    providerFacets,
    pageTypeFacets,
    initialResults,
    pageSize = 10,
    maxPaginationButtons = 7,
  } = options;

  const api = useMemo(() => createSearchApi(language), [language]);

  const initialPage = initialResults?.currentPageNumber ?? initialPageNumber;

  const [items, setItems] = useState<any>(
    initialResults?.items ?? [],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasNoResults, setHasNoResults] = useState(
    (initialResults?.items?.length ?? 0) === 0,
  );
  const [pageNumber, setPageNumber] = useState<number>(initialPage);
  const [totalResultCount, setTotalResultCount] = useState<number>(
    initialResults?.totalResultCount ?? 0,
  );
  const [filters, setFilters] = useState<FilterState>(() => ({
    providers: [],
    pagetypes: [currentContext || "All"],
  }));

  const selectedProviders = (filters.providers ?? []) as string[];
  const totalItems =
    selectedProviders.length > 0
      ? providerFacets
          .filter((x: any) => x.value !== undefined && selectedProviders.includes(x.value))
          .reduce((sum: any, x: any) => sum + x.count, 0)
      : totalResultCount;

  const calculatedTotalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const inFlight = useRef<AbortController | null>(null);

  const normalizeFilterValues = (state: FilterState) => {
    const providers = ((state.providers ?? []) as (string | number)[]).map(
      String,
    );
    const pageType = String((state.pagetypes ?? [])[0] ?? "");
    return { providers, pageType };
  };

  const pageTypeLabelByValue = useMemo(
    () =>
      Object.fromEntries((pageTypeFacets ?? []).map((f: any) => [f.value, f.name])),
    [pageTypeFacets],
  );

  const writeUrl = useCallback((q: string, context?: string) => {
    if (!isBrowser) return;
    if (!q || q.trim() === "") return;

    const queryString = buildBrowserParams({
      query: q,
      context: context,
    });
    const next = `${location.pathname}?${queryString}`;
    history.pushState({}, "", next);
  }, []);

  const fetchPage = useCallback(
    async (page: number, providers: string[], pageType: string) => {
      if (!query || query.trim() === "") return;

      writeUrl(query, pageType || currentContext);

      if (inFlight.current) inFlight.current.abort();
      const controller = new AbortController();
      inFlight.current = controller;

      setLoading(true);
      setError(null);

      try {
        const result = await api.getSearchPages(
          query,
          page,
          providers,
          pageType,
          controller.signal,
        );
        if (result?.items?.length) {
          setItems(result.items);
          setTotalResultCount(result.totalResultCount ?? 0);
          setHasNoResults(false);
        } else {
          setItems([]);
          setTotalResultCount(0);
          setHasNoResults(true);
        }
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        // eslint-disable-next-line no-console
        console.error("Error fetching search results:", err);
        setError(err instanceof Error ? err : new Error("Unknown error"));
        setHasNoResults(false);
      } finally {
        setLoading(false);
        inFlight.current = null;
      }
    },
    [api, writeUrl, query, currentContext],
  );

  const { pages, prevButtonProps, nextButtonProps } = usePagination({
    currentPage: pageNumber,
    totalPages: calculatedTotalPages,
    showPages:
      calculatedTotalPages < maxPaginationButtons
        ? calculatedTotalPages
        : maxPaginationButtons,
    onChange: (_event: any, page: number) => {
      const pageType = ((filters.pagetypes ?? [])[0] ?? "") as string;
      const providers = (filters.providers ?? []) as string[];
      setPageNumber(page);
      void fetchPage(page, providers, pageType);
    },
  });

  const applyFilters = useCallback(
    (nextState: FilterState) => {
      setFilters((prev) => {
        const merged = { ...prev, ...nextState };
        const { providers, pageType } = normalizeFilterValues(merged);

        const prevPageType = String((prev?.pagetypes ?? [])[0] ?? "");
        writeUrl(query, pageType || currentContext);

        if (pageType !== prevPageType && pageType === "All") {
          if (isBrowser) location.reload();
          return merged;
        }

        setPageNumber(1);
        void fetchPage(1, providers, pageType);
        return merged;
      });
    },
    [fetchPage, query, writeUrl, currentContext],
  );

  return {
    items,
    loading,
    error,
    hasNoResults,
    pageNumber,
    filters,
    applyFilters,
    totalItems,
    calculatedTotalPages,
    pages,
    prevButtonProps,
    nextButtonProps,
    pageTypeLabelByValue,
  };
}
