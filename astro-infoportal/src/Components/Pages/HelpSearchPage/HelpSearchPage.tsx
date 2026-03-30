import {
  Article,
  ArticleHeader,
  DsLink,
  Heading,
  Typography,
} from "@altinn/altinn-components";
import { Card, Details } from "@digdir/designsystemet-react";
import { useEffect, useState } from "react";
import BreadcrumbsView from "../../Layout/Breadcrumbs/BreadcrumbsView";
import RichTextArea from "../../Shared/RichTextArea/RichTextArea";
import SearchInput from "../../Shared/SearchInput/SearchInput";
import "./HelpSearchPage.scss";

const isBrowser =
  typeof location !== "undefined" && typeof history !== "undefined";

const HelpSearchPage = ({
  pageName,
  query,
  totalHits,
  results,
  searchHitsText,
  searchForText,
  advertisementIntroText,
  clickHereText,
  toSearchForText,
  inText,
  otherContentText,
  searchPageUrl,
  helpSearchPageUrl,
  searchPlaceholder,
  breadcrumb,
}: any) => {
  const getInitialSearchValue = () => {
    if (!isBrowser) return query || "";
    try {
      const urlParams = new URLSearchParams(location.search);
      return urlParams.get("q") || query || "";
    } catch {
      return query || "";
    }
  };

  const [searchValue, setSearchValue] = useState<string>(getInitialSearchValue);

  useEffect(() => {
    if (!isBrowser) return;
    const syncPageChanges = () => {
      try {
        const urlParams = new URLSearchParams(location.search);
        const queryFromUrl = urlParams.get("q") || "";
        setSearchValue(queryFromUrl);
      } catch {}
    };

    addEventListener("popstate", syncPageChanges);
    return () => removeEventListener("popstate", syncPageChanges);
  }, []);

  const handleSearchEnter = () => {
    if (!isBrowser || !helpSearchPageUrl) return;
    const trimmedValue = (searchValue || "").trim();
    const url = new URL(helpSearchPageUrl, location.origin);
    if (trimmedValue) url.searchParams.set("q", trimmedValue);
    location.assign(url.toString());
  };

  return (
    <Article>
      {breadcrumb && <BreadcrumbsView {...breadcrumb} />}
      <ArticleHeader>
        <Heading size="xl" as="h1">
          {pageName}
        </Heading>
      </ArticleHeader>

      {helpSearchPageUrl && (
        <SearchInput
          placeholder={searchPlaceholder || ""}
          searchPageUrl={helpSearchPageUrl}
          name="search-help"
          value={searchValue}
          onChange={setSearchValue}
          onSubmit={handleSearchEnter}
          ariaLabel={searchPlaceholder}
        />
      )}

      {query && (
        <div className="help-search-page__search-info">
          {searchPageUrl && (
            <Typography>
              {advertisementIntroText}.{" "}
              <DsLink href={`${searchPageUrl}?q=${encodeURIComponent(query)}`}>
                {clickHereText}
              </DsLink>{" "}
              {toSearchForText} <strong>"{query}"</strong> {inText}{" "}
              {otherContentText}.
            </Typography>
          )}

          <Typography as="h2">
            <strong>
              {totalHits} {searchHitsText}
            </strong>{" "}
            {searchForText} <strong>"{query}"</strong>
          </Typography>
        </div>
      )}

      {results && results.length > 0 && (
        <Card data-color="neutral">
          {results.map((result: any, idx: number) => (
            <Details
              key={idx}
              variant="default"
              data-color="neutral"
              data-size="md"
            >
              <Details.Summary role="button" tabIndex={0} slot="summary">
                {result.pageName}
              </Details.Summary>
              <Details.Content>
                {result.body && <RichTextArea {...result.body} />}
              </Details.Content>
            </Details>
          ))}
        </Card>
      )}
    </Article>
  );
};

export default HelpSearchPage;
