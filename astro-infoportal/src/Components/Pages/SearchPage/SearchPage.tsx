import {
  Divider,
  DsLink,
  Heading,
  List,
  PageBase,
  SearchItem,
  Section,
  Toolbar,
  Typography,
} from "@altinn/altinn-components";
import type { FilterState } from "@altinn/altinn-components";
import { Button, Pagination } from "@digdir/designsystemet-react";
import * as AkselIcons from "@navikt/aksel-icons";
import { useResponsivePagination } from "/Services/Hooks/UseResponsivePagination";
import { useSearchPage } from "/Services/Hooks/UseSearch";
import IconItemsInline from "../../Shared/IconItemsInline/IconItemsInline";
import type { IconItemsInlineItem } from "../../Shared/IconItemsInline/IconItemsInline";
import ProvidersInline from "../../Shared/ProvidersInline/ProvidersInline";
import type { ProviderInlineItem } from "../../Shared/ProvidersInline/ProvidersInline";
import SearchInput from "../../Shared/SearchInput/SearchInput";
import "./SearchPage.scss";
import { useEffect, useState } from "react";
import type { SearchPageProps } from "./SearchPage.types";
import { SearchContext, SearchContextIcons, SearchContextLabels } from "@constants/searchContext";

const PAGE_SIZE = 10;

const isBrowser =
  typeof location !== "undefined" && typeof history !== "undefined";

const getIcon = (iconName?: string) => {
  if (!iconName) return undefined;
  const IconComponent = (AkselIcons as any)[iconName];
  return IconComponent || undefined;
};

const highlightText = (text: string, query: string) => {
  if (!query || !text) return text;

  const regex = new RegExp(
    `(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
    "gi",
  );
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part: any, index: number) =>
        regex.test(part) ? (
          <mark key={index} className="search-highlight">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
};

const highlightHtml = (html: string, query: string): string => {
  if (!query || !html) return html;

  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(?![^<]*>)(${escapedQuery})`, "gi");

  return html.replace(regex, '<mark class="search-highlight">$1</mark>');
};

const SearchPage = ({
  currentLanguage,
  currentQuery,
  currentContext,
  pageTypeFacets,
  providerFacets,
  searchResultViewModel,
  suggestionTerm,
  suggestionTermText,
  categoriesText,
  providersText,
  noResultsText,
  errorText,
  lastPageText,
  nextPageText,
  loadingText,
  providerFilterText,
  searchPlaceholder,
  searchAriaLabel,
  searchHeading
}: SearchPageProps) => {
  const { maxPaginationButtons, isMobile } = useResponsivePagination();
  const safePageTypeFacets = Array.isArray(pageTypeFacets) ? pageTypeFacets : [];
  const safeProviderFacets = Array.isArray(providerFacets) ? providerFacets : [];

  const getInitialSearchValue = () => {
    if (!isBrowser) return currentQuery || "";
    try {
      const urlParams = new URLSearchParams(location.search);
      return urlParams.get("q") || currentQuery || "";
    } catch {
      return currentQuery || "";
    }
  };

  const [searchValue, setSearchValue] = useState<string>(getInitialSearchValue);

  const handleSearchEnter = () => {
    if (!isBrowser) return;

    const trimmedValue = (searchValue || "").trim();
    const baseUrl = location.origin + location.pathname;
    const url = new URL(baseUrl);

    if (trimmedValue) {
      url.searchParams.set("q", trimmedValue);
    }

    location.assign(url.toString());
  };

  useEffect(() => {
    if (!isBrowser) return;

    const syncPageChanges = () => {
      try {
        const urlParams = new URLSearchParams(location.search);
        const queryFromUrl = urlParams.get("q") || "";
        setSearchValue(queryFromUrl);
      } catch { }
    };

    addEventListener("popstate", syncPageChanges);
    return () => removeEventListener("popstate", syncPageChanges);
  }, []);

  const {
    items,
    loading,
    error,
    hasNoResults,
    filters,
    applyFilters,
    pages,
    prevButtonProps,
    nextButtonProps,
    calculatedTotalPages,
    pageTypeLabelByValue,
    livePageTypeFacets,
    liveProviderFacets,
  } = useSearchPage({
    language: currentLanguage || "nb",
    query: currentQuery || "",
    initialPageNumber: searchResultViewModel?.currentPageNumber ?? 1,
    currentContext: currentContext || SearchContext.All,
    providerFacets: safeProviderFacets,
    pageTypeFacets: safePageTypeFacets,
    initialResults: searchResultViewModel || undefined,
    pageSize: PAGE_SIZE,
    maxPaginationButtons: maxPaginationButtons,
  });

  const showPagination = calculatedTotalPages > 1;

  const selectedContext = String(
    (filters.pagetypes ?? [])[0] ?? currentContext ?? "All",
  );
  const hasProviders = (liveProviderFacets ?? safeProviderFacets).length > 0;
  const showProviderFilter =
    hasProviders && (selectedContext === "All" || selectedContext === SearchContext.Schema);

  return (
    <PageBase className="search-page">
      <Heading as="h2" size="xl">
        {searchHeading || searchPlaceholder}
      </Heading>
      <SearchInput
        searchPageUrl={isBrowser ? location.href : ""}
        value={searchValue}
        onChange={setSearchValue}
        onSubmit={handleSearchEnter}
        ariaLabel={searchAriaLabel}
        autoFocus={!currentQuery}
      />
      {items && items.length > 0 && (
        <Toolbar
          filter={{
            filters: [
              {
                id: "pagetypes",
                label: categoriesText || "",
                title: categoriesText || "",
                name: "pagetypes",
                virtualized: true,
                removable: false,
                items: (livePageTypeFacets ?? safePageTypeFacets)
                  .filter((pt: any) => pt.name != null && pt.value != null)
                  .map((pageType: any) => ({
                    title: pageType.name,
                    value: pageType.value,
                    count: pageType.count,
                    role: "radio" as const,
                    name: "pagetypes",
                  })),
              },
              ...(showProviderFilter
                ? [
                  {
                    id: "providers",
                    label: providersText || "",
                    title: providersText || "",
                    name: "providers",
                    searchable: true,
                    removable: false,
                    items: (liveProviderFacets ?? safeProviderFacets)
                      .filter((pf: any) => pf.name != null && pf.value != null)
                      .map((provider: any) => ({
                        title: provider.name,
                        value: provider.value,
                        count: provider.count,
                        role: "checkbox" as const,
                        name: "providers",
                      })),
                  },
                ]
                : []),
            ],
            filterState: filters,
            getFilterLabel: (
              name: string,
              value: (string | number)[] | undefined,
            ) => {
              if (!value?.length && name === "pagetypes")
                return categoriesText || "";
              if (!value?.length && name === "providers")
                return providersText || "";

              if (name === "pagetypes") {
                const v = String(value?.[0]);
                return pageTypeLabelByValue?.[v] ?? v;
              }

              if (name === "providers") {
                if ((value?.length ?? 0) >= 3) {
                  return `${value?.length} ${providerFilterText}`;
                }
                return value?.map(String).join(", ");
              }
              return value?.map(String).join(", ");
            },
            onFilterStateChange: (newFilterState: FilterState) => {
              applyFilters(newFilterState);
            },
          }}
        />
      )}

      <Section margin="section">
        {loading && (
          <Button variant="tertiary" loading>
            {loadingText}
          </Button>
        )}
        {error &&
          <Typography as="p">
            {errorText}
          </Typography>}
        {hasNoResults && currentQuery &&
          <Typography as="p">
            {noResultsText + ''} <strong>{'"' + currentQuery + '"'}</strong>
          </Typography>}
        {hasNoResults && suggestionTerm && suggestionTermText && (
          <Typography as="p">
            {suggestionTermText + ' '}
            <DsLink href={`/sok/?q=${encodeURIComponent(suggestionTerm)}`}>
              {suggestionTerm}
            </DsLink>
            {"?"}
          </Typography>
        )}

        <List>
          {items?.map((item: any, index: number) => {
            const key = item.id ?? item.code ?? index;

            const hasProvidersArray =
              Array.isArray(item.providers) && item.providers.length > 0;

            let summary: React.ReactNode | undefined;

            if (hasProvidersArray) {
              const providers: ProviderInlineItem[] = item.providers.map(
                (p: any) => ({
                  name: p.name,
                  imageUrl: p.imageUrl,
                  url: p.url,
                }),
              );
              summary = (
                <>
                  <ProvidersInline
                    providers={providers}
                    strong={true}
                    disableLinks={true}
                  />
                  {item.ingress && (
                    <div
                      dangerouslySetInnerHTML={{
                        __html: highlightHtml(item.ingress, currentQuery || ""),
                      }}
                    />
                  )}
                </>
              );
            } else if (item.parentContext?.value) {
              const contextValue = item.parentContext.value;
              const iconName = SearchContextIcons[contextValue];
              const Icon = getIcon(iconName);
              const contextLabel = SearchContextLabels[currentLanguage || "nb"]?.[contextValue] ?? contextValue;
              if (Icon) {
                const contextItem: IconItemsInlineItem = {
                  label: contextLabel,
                  icon: Icon,
                };
                summary = (
                  <>
                    <IconItemsInline
                      items={[contextItem]}
                      strong={true}
                      disableLinks={true}
                    />
                    {item.ingress && (
                      <div
                        dangerouslySetInnerHTML={{
                          __html: highlightHtml(item.ingress, currentQuery || ""),
                        }}
                      />
                    )}
                  </>
                );
              } else if (item.ingress) {
                summary = (
                  <div
                    dangerouslySetInnerHTML={{
                      __html: highlightHtml(item.ingress, currentQuery || ""),
                    }}
                  />
                );
              }
            } else if (item.ingress) {
              summary = (
                <div
                  dangerouslySetInnerHTML={{
                    __html: highlightHtml(item.ingress, currentQuery || ""),
                  }}
                />
              );
            }

            const highlightedTitle = highlightText(
              item.title,
              currentQuery || "",
            );

            return (
              <>
                <SearchItem
                  key={key}
                  as="a"
                  href={item.url || "#"}
                  title={highlightedTitle || item.title || ""}
                  summary={summary}
                />
                <Divider as="li" key={`div-${key}`} />
              </>
            );
          })}
        </List>
      </Section>

      {showPagination && (
        <Pagination>
          <Pagination.List>
            <Pagination.Item>
              <Pagination.Button
                aria-label={lastPageText}
                {...prevButtonProps}
              >
                {!isMobile && lastPageText}
              </Pagination.Button>
            </Pagination.Item>

            {pages.map(({ page, itemKey, buttonProps }) => (
              <Pagination.Item key={itemKey}>
                {typeof page === "number" && (
                  <Pagination.Button
                    {...buttonProps}
                    aria-label={`Side ${page}`}
                  >
                    {page}
                  </Pagination.Button>
                )}
              </Pagination.Item>
            ))}

            <Pagination.Item>
              <Pagination.Button
                aria-label={nextPageText}
                {...nextButtonProps}
              >
                {!isMobile && nextPageText}
              </Pagination.Button>
            </Pagination.Item>
          </Pagination.List>
        </Pagination>
      )}
    </PageBase>


  );
};

export default SearchPage;
