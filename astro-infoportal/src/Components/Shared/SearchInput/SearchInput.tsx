import { DsSearch } from "@altinn/altinn-components";
import { MagnifyingGlassIcon } from "@navikt/aksel-icons";
import { useState } from "react";
import { useIsDesktop } from "/Services/Hooks/UseMediaQuery";
import "./SearchInput.scss";

const isBrowser =
  typeof location !== "undefined" && typeof history !== "undefined";

interface SearchInputProps {
  placeholder?: string;
  searchPageUrl: string;
  initialValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSubmit?: () => void;
  name?: string;
  ariaLabel?: string;
  className?: string;
  autoFocus?: boolean;
}

const SearchInput = ({
  placeholder,
  searchPageUrl,
  initialValue = "",
  value: controlledValue,
  onChange: controlledOnChange,
  onSubmit,
  ariaLabel,
  className,
  autoFocus,
}: SearchInputProps) => {
  const [internalQuery, setInternalQuery] = useState<string>(initialValue);
  const isDesktop = useIsDesktop();

  const isControlled = controlledValue !== undefined;
  const query = isControlled ? controlledValue : internalQuery;

  const handleChange = (newValue: string) => {
    if (controlledOnChange) {
      controlledOnChange(newValue);
    }
    if (!isControlled) {
      setInternalQuery(newValue);
    }
  };

  const handleSearchSubmit = () => {
    if (onSubmit) {
      onSubmit();
      return;
    }

    if (!isBrowser || !searchPageUrl) return;

    const trimmedValue = (query || "").trim();
    const url = new URL(searchPageUrl, location.origin);

    if (trimmedValue) {
      url.searchParams.set("q", trimmedValue);
    } else {
      url.searchParams.delete("q");
    }

    location.assign(url.toString());
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSearchSubmit();
      }}
      className={className}
    >
      <DsSearch
        className="global-search"
        data-size={isDesktop ? "lg" : "md"}
      >
        <DsSearch.Input
          placeholder={placeholder}
          onChange={(e) => handleChange(e.target.value)}
          value={query}
          aria-label={ariaLabel || placeholder}
          className="search-input"
          autoFocus={autoFocus}
        />
        <DsSearch.Clear />
        <DsSearch.Button
          variant="secondary"
          icon
          aria-label={ariaLabel || placeholder}
          className="search-input-button"
        >
          <MagnifyingGlassIcon />
        </DsSearch.Button>
      </DsSearch>
    </form>
  );
};

export default SearchInput;
