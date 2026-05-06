import * as React from "react";
import { useState } from "react";
import "./SearchForm.scss";
import { MagnifyingGlassIcon } from "@navikt/aksel-icons";

const SearchForm = ({
  searchLabel,
  query,
  preamble,
  searchPageUrl,
}: any) => {
  const [searchQuery, setSearchQuery] = useState(query || "");

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = (searchQuery || "").trim();
    if (typeof window !== "undefined" && trimmed && searchPageUrl) {
      const url = new URL(searchPageUrl, window.location.origin);
      url.searchParams.set("q", trimmed);
      window.location.assign(url.toString());
    }
  };

  const handleSearchClick = () => {
    const trimmed = (searchQuery || "").trim();
    if (typeof window !== "undefined" && trimmed && searchPageUrl) {
      const url = new URL(searchPageUrl, window.location.origin);
      url.searchParams.set("q", trimmed);
      window.location.assign(url.toString());
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="form-group a-form-group a-form-group-large"
    >
      <label className="a-form-label sr-only" htmlFor="search">
        {searchLabel}
      </label>
      <div className="search-wrapper">
        <div className="a-form-group-items input-group">
          <input
            className="form-control a-hasButton"
            type="text"
            placeholder={searchLabel}
            name="search-input-field"
            data-val="true"
            id="search"
            value={searchQuery}
            autoComplete="off"
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="input-group-append">
            <button
              className="btn btn-secondary"
              type="button"
              name="search-button"
              onClick={handleSearchClick}
              disabled={!searchQuery || searchQuery.trim().length === 0}
            >
              <MagnifyingGlassIcon aria-hidden="true" style={{ color: "black" }}/>
              <span className="sr-only">{searchLabel}</span>
            </button>
          </div>
          {preamble && (
            <p
              style={{
                textAlign: "center",
                fontSize: "larger",
                paddingTop: "2em",
                marginBottom: 0,
              }}
            >
              <span>{preamble}</span>
            </p>
          )}
        </div>
      </div>
    </form>
  );
};

export default SearchForm;
