import { buildQuery, getJson } from "../Utils/ApiUtils";
import type { Fetcher } from "../Utils/ApiUtils";
import type { SearchSuggestionCollection } from "/Models/Local/SearchSuggestionCollection";

export function createSearchApi(language: string, fetchImpl?: Fetcher) {
    const base = `/api/search/${language}`;

    async function getSearchPages(query: string, pageNumber: number, providers?: string[], context?: string, signal?: AbortSignal): Promise<any> {
        const queryString = buildQuery({
            q: query,
            pagenumber: String(pageNumber),
            context,
            ...(providers && providers.length ? { providers } : undefined),
        });
        return getJson<any>(`${base}/page?${queryString}`, { signal, fetchImpl });
    }

    async function getSuggestions(query: string, signal?: AbortSignal): Promise<SearchSuggestionCollection> {
        const queryString = buildQuery({ q: query });
        return getJson<SearchSuggestionCollection>(`${base}/suggestions?${queryString}`, { signal, fetchImpl });
    }

    return { getSearchPages, getSuggestions };
}
