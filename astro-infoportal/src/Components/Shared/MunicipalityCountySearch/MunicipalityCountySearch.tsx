import { useEffect, useState } from "react";
import type {
  MunicipalityItem,
  MunicipalityItems,
} from "/Models/Local/MunicipalityItem";
import "./MunicipalityCountySearch.scss";
import {
  Divider,
  List,
  Searchbar,
  SearchItem,
  Section,
  Typography,
} from "@altinn/altinn-components";
export interface MunicipalityCountySearchProps {
  apiSourceUrl: string;
  whatText: string;
  searchPlaceholder: string;
  noHitText: string;
}

const MunicipalityCountySearch = ({
  apiSourceUrl,
  whatText,
  searchPlaceholder,
  noHitText,
}: MunicipalityCountySearchProps) => {
  const [items, setItems] = useState<MunicipalityItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(apiSourceUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: MunicipalityItems = await response.json();
        setItems(data.items || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data");
        console.error("Failed to fetch municipality/county data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [apiSourceUrl]);

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.parent.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (error) {
    return (
      <div className="municipality-county-search__error" role="alert">
        {error}
      </div>
    );
  }

  return (
    <div className="municipality-county-search">
      <Typography as="h2">{whatText}</Typography>

      <div className="municipality-county-search__search-container">
        <Searchbar
          name="municipality-county-search"
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSearchTerm(e.target.value)
          }
          aria-label={searchPlaceholder}
        />
      </div>

      {isLoading ? (
        <div
          className="municipality-county-search__loading"
          aria-live="polite"
          aria-busy="true"
        >
          ...
        </div>
      ) : searchTerm ? (
        <>
          <Section margin="section">
            <List>
              {filteredItems?.map((article, index) => (
                <div key={index}>
                  <SearchItem as="a" href={article.url} title={article.name} />
                  <Divider as="li" />
                </div>
              ))}
            </List>
          </Section>

          {filteredItems.length === 0 && !isLoading && (
            <p
              className="municipality-county-search__no-results"
              aria-live="polite"
            >
              {noHitText}
            </p>
          )}
        </>
      ) : null}
    </div>
  );
};

export default MunicipalityCountySearch;
