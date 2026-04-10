import { useEffect, useMemo, useState } from "react";
import BreadcrumbsView from "../../Layout/Breadcrumbs/BreadcrumbsView";
import "./SubsidyOverviewPage.scss";
import "../../../styles/legacy-pages.scss";
import type { SubsidyOverviewPageProps } from "./SubsidyOverviewPage.types";

interface SubsidyData {
  subsidyName: string;
  subsidyIntro: string;
  url: string;
  filterId: string;
  filterName: string;
  purposes: string[];
  industries: string[];
}

interface FilterOption {
  id: string;
  title: string;
}

const SubsidyOverviewPage = ({
  pageName,
  mainIntro,
  subsidyApiUrl,
  breadcrumb,
  translations: translationsProp,
}: SubsidyOverviewPageProps) => {
  const translations = translationsProp ?? {
    purposeHeader: "",
    youHaveChosen: "",
    purpose: "",
    purposePlural: "",
    choose: "",
    industrySingle: "",
    industryMultiple: "",
    industryIndependentWillShow: "",
    showMeSubsidy: "",
    noHits: "",
    industryIndependent: "",
  };

  const [subsidies, setSubsidies] = useState<SubsidyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPurposes, setSelectedPurposes] = useState<string[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [purposeOptions, setPurposeOptions] = useState<FilterOption[]>([]);
  const [industryOptions, setIndustryOptions] = useState<FilterOption[]>([]);
  const [purposeFilterOpen, setPurposeFilterOpen] = useState(false);
  const [industryFilterOpen, setIndustryFilterOpen] = useState(false);
  const [showResults, setShowResults] = useState(false);
  // Removed pagination; show all results

  // Read query param ?filter=d1-<purposeId>,d2-<industryId>,...
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const url = new URL(window.location.href);
      const filterParam = url.searchParams.get("filter") || "";
      if (!filterParam) return;
      const tokens = filterParam
        .split(",")
        .map((t: any) => t.trim())
        .filter(Boolean);
      const purposes: string[] = [];
      const industries: string[] = [];
      tokens.forEach((tok: any) => {
        const m = /^d(\d+)-(\d+)$/.exec(tok);
        if (m) {
          const dim = m[1];
          const id = m[2];
          if (dim === "1") purposes.push(id);
          else if (dim === "2") industries.push(id);
        }
      });
      if (purposes.length) setSelectedPurposes(purposes);
      if (industries.length) setSelectedIndustries(industries);
    } catch {}
  }, []);

  // Sync current selections to query param ?filter=...
  useEffect(() => {
    if (typeof window === "undefined" || typeof history === "undefined") return;
    try {
      const parts: string[] = [];
      // stable sort for deterministic URLs
      [...selectedPurposes].sort().forEach((id: any) => {
        parts.push(`d1-${id}`);
      });
      [...selectedIndustries].sort().forEach((id: any) => {
        parts.push(`d2-${id}`);
      });

      const url = new URL(window.location.href);
      if (parts.length) url.searchParams.set("filter", parts.join(","));
      else url.searchParams.delete("filter");
      history.replaceState({}, "", url.toString());
    } catch {}
  }, [selectedPurposes, selectedIndustries]);

  // Hide results whenever filters change; user must click button to show
  useEffect(() => {
    setShowResults(false);
  }, [selectedPurposes, selectedIndustries]);

  // Load subsidy data from API
  useEffect(() => {
    const loadSubsidies = async () => {
      try {
        if (!subsidyApiUrl) {
          setSubsidies([]);
          return;
        }
        const response = await fetch(subsidyApiUrl);
        const data = await response.json();

        if (data && typeof data === "object") {
          const subs: any[] = Array.isArray((data as any).subsidiesList)
            ? (data as any).subsidiesList
            : [];

          const list: SubsidyData[] = subs.map((s: any) => ({
            subsidyName: s.subsidyName,
            subsidyIntro: s.subsidyIntro,
            url: s.url,
            filterId: "",
            filterName: "",
            purposes: (s.purposes || []).map((p: any) => String(p)),
            industries: (s.industries || []).map((i: any) => String(i)),
          }));

          const purposeList: FilterOption[] = Array.isArray(
            (data as any).purposeList,
          )
            ? (data as any).purposeList.map((p: any) => ({
                id: String(p.filterId),
                title: String(p.filterName),
              }))
            : [];

          const industryList: FilterOption[] = Array.isArray(
            (data as any).industryList,
          )
            ? (data as any).industryList.map((i: any) => ({
                id: String(i.filterId),
                title: String(i.filterName),
              }))
            : [];

          setSubsidies(list);
          setPurposeOptions(purposeList);
          setIndustryOptions(industryList);
        } else if (Array.isArray(data)) {
          setSubsidies(data as SubsidyData[]);
        } else {
          setSubsidies([]);
        }
      } catch (error) {
        console.error("Failed to load subsidy data:", error);
        setSubsidies([]);
      } finally {
        setLoading(false);
      }
    };

    loadSubsidies();
  }, [subsidyApiUrl]);

  // purposeOptions and industryOptions are set from API response lists

  // Filter subsidies based on selected filters
  const filteredSubsidies = useMemo(() => {
    if (selectedPurposes.length === 0 && selectedIndustries.length === 0) {
      return subsidies;
    }

    return subsidies.filter((subsidy: any) => {
      const purposeMatch =
        selectedPurposes.length === 0 ||
        subsidy.purposes?.some((p: any) => selectedPurposes.includes(p));

      const industryMatch =
        selectedIndustries.length === 0 ||
        subsidy.industries?.length === 0 || // Industry-independent
        subsidy.industries?.some((i: any) => selectedIndustries.includes(i));

      return purposeMatch && industryMatch;
    });
  }, [subsidies, selectedPurposes, selectedIndustries]);

  // Separate industry-independent results
  const mainResults = filteredSubsidies.filter(
    (s) => !s.industries || s.industries.length > 0,
  );
  const industryIndependentResults = filteredSubsidies.filter(
    (s) => s.industries && s.industries.length === 0,
  );

  const visibleResults = mainResults;

  const handlePurposeToggle = (purposeId: string) => {
    setSelectedPurposes((prev) =>
      prev.includes(purposeId)
        ? prev.filter((id: any) => id !== purposeId)
        : [...prev, purposeId],
    );
  };

  const handleIndustryToggle = (industryId: string) => {
    setSelectedIndustries((prev) =>
      prev.includes(industryId)
        ? prev.filter((id: any) => id !== industryId)
        : [...prev, industryId],
    );
  };

  const handleShowResults = () => {
    setPurposeFilterOpen(false);
    setIndustryFilterOpen(false);
    setShowResults(true);
  };

  // Removed load more; all results are visible

  if (loading) {
    return (
      <div className="container">
        <section id="content">
          <div className="container">
            <div className="a-loader">
              <div className="loader loader-ellipsis"></div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <section id="content" className="legacy-page" tabIndex={-1}>
      <div className="container a-filterGuide">
        <div className="row">
          <div className="col-sm-12 col-lg-10 offset-lg-1 pb-1">
            {breadcrumb && <BreadcrumbsView {...breadcrumb} />}
            <h1 className="a-fontBold a-pageTitle">{pageName}</h1>
            {mainIntro && (
              <p className="a-leadText" id="leadText">
                {mainIntro}
              </p>
            )}
            <h2 className="a-h3 pt-5">{translations.purposeHeader}</h2>
          </div>
        </div>

        {/* Purpose Filter */}
        <div className="row">
          <div className="col-sm-12 col-lg-12">
            <div
              className="a-card a-card-filter"
              style={{ backgroundColor: "#EFEFEF" }}
            >
              <div className="a-collapse">
                <div className="row">
                  <div className="col">
                    <h2 className="a-collapseHeader a-h3">
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setPurposeFilterOpen(!purposeFilterOpen);
                        }}
                        className={`a-collapse-title a-collapse-title--absolute subsidy-filter-title no-decoration ${
                          purposeFilterOpen ? "" : "collapsed"
                        }`}
                        aria-expanded={purposeFilterOpen}
                      >
                        <span className="a-dropdownArrow"></span>
                        {selectedPurposes.length > 0 ? (
                          <span>
                            {translations.youHaveChosen}{" "}
                            <span className="badge badge-primary a-label badge-pill">
                              {selectedPurposes.length}
                            </span>{" "}
                            {selectedPurposes.length === 1
                              ? translations.purpose
                              : translations.purposePlural}
                          </span>
                        ) : (
                          <span>
                            {translations.choose} {translations.purpose}
                          </span>
                        )}
                      </a>
                    </h2>
                  </div>
                </div>
              </div>
              <div
                className="a-collapseContent"
                style={{
                  maxHeight: purposeFilterOpen ? "1000px" : "0",
                  overflow: "hidden",
                  transition: "max-height 0.3s ease-in-out",
                  padding: purposeFilterOpen ? undefined : "0",
                }}
              >
                <div className="text-sm-center pt-1">
                  {purposeOptions.map((option: any) => (
                    <div key={option.id} className="a-switch">
                      <input
                        id={`purpose-${option.id}`}
                        className="sr-only"
                        type="checkbox"
                        checked={selectedPurposes.includes(option.id)}
                        onChange={() => handlePurposeToggle(option.id)}
                      />
                      <label
                        htmlFor={`purpose-${option.id}`}
                        className="a-switch-label"
                      >
                        {option.title}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Industry Filter */}
            <div
              className="a-card a-card-filter"
              style={{ backgroundColor: "#EFEFEF" }}
            >
              <div className="a-collapse">
                <div className="row">
                  <div className="col">
                    <h2 className="a-collapseHeader a-h3">
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setIndustryFilterOpen(!industryFilterOpen);
                        }}
                        className={`a-collapse-title a-collapse-title--absolute subsidy-filter-title no-decoration ${
                          industryFilterOpen ? "" : "collapsed"
                        }`}
                        aria-expanded={industryFilterOpen}
                      >
                        <span className="a-dropdownArrow"></span>
                        {selectedIndustries.length > 0 ? (
                          <span>
                            {translations.youHaveChosen}{" "}
                            <span className="badge badge-primary a-label badge-pill">
                              {selectedIndustries.length}
                            </span>{" "}
                            {selectedIndustries.length === 1
                              ? translations.industrySingle
                              : translations.industryMultiple}
                          </span>
                        ) : (
                          <span>
                            {translations.choose} {translations.industrySingle}
                          </span>
                        )}
                      </a>
                    </h2>
                  </div>
                </div>
              </div>
              <div
                className="a-collapseContent"
                style={{
                  maxHeight: industryFilterOpen ? "1000px" : "0",
                  overflow: "hidden",
                  transition: "max-height 0.3s ease-in-out",
                  padding: industryFilterOpen ? undefined : "0",
                }}
              >
                <div className="text-sm-center pt-1">
                  {industryOptions.map((option: any) => (
                    <div key={option.id} className="a-switch">
                      <input
                        id={`industry-${option.id}`}
                        className="sr-only"
                        type="checkbox"
                        checked={selectedIndustries.includes(option.id)}
                        onChange={() => handleIndustryToggle(option.id)}
                      />
                      <label
                        htmlFor={`industry-${option.id}`}
                        className="a-switch-label"
                      >
                        {option.title}
                      </label>
                    </div>
                  ))}
                  <span
                    className="d-block pt-1"
                    style={{
                      marginTop: "16px",
                      fontSize: "12px",
                      fontWeight: "600",
                    }}
                  >
                    * {translations.industryIndependentWillShow}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Show Results Button */}
        {!showResults &&
          (selectedPurposes.length > 0 || selectedIndustries.length > 0) && (
            <div className="row">
              <div className="col-sm-12 col-lg-12">
                <button
                  type="button"
                  className="a-btn a-btn--full"
                  onClick={handleShowResults}
                >
                  <span className="a-btn-icon-text">
                    {translations.showMeSubsidy}
                  </span>
                </button>
              </div>
            </div>
          )}

        {/* Results */}
        {showResults && (
          <div className="row mt-3">
            <div className="col-sm-12 col-lg-10 offset-lg-1 pb-3">
              {filteredSubsidies.length === 0 ? (
                <p>{translations.noHits}</p>
              ) : (
                <>
                  {visibleResults.map((subsidy: any, index: number) => (
                    <article
                      key={`${subsidy.filterId}-${index}`}
                      className="subsidy-result"
                    >
                      <h2>
                        <a href={subsidy.url}>{subsidy.subsidyName}</a>
                      </h2>
                      <p>{subsidy.subsidyIntro}</p>
                    </article>
                  ))}

                  {industryIndependentResults.length > 0 && (
                    <>
                      <h2
                        className="a-h4 a-borderBottom mt-4 mb-2"
                        style={{
                          fontSize: "1.5rem",
                          fontWeight: "600",
                          borderBottom: "none",
                        }}
                      >
                        {translations.industryIndependent}:
                      </h2>
                      {industryIndependentResults.map((subsidy: any, index: number) => (
                        <article
                          key={`alt-${subsidy.filterId}-${index}`}
                          className="subsidy-result"
                        >
                          <h2>
                            <a href={subsidy.url}>{subsidy.subsidyName}</a>
                          </h2>
                          <p>{subsidy.subsidyIntro}</p>
                        </article>
                      ))}
                    </>
                  )}

                  {/* Load more removed; all results shown */}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default SubsidyOverviewPage;