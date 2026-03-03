import { ContentArea } from "/App.Components";
import { SectionPageViewModel } from "/Models/Generated/SectionPageViewModel";
// import BreadcrumbsView from "../../Layout/Breadcrumbs/BreadcrumbsView";
import "../../../styles/legacy-pages.scss";
import "./SectionPage.scss";
// import { ArrowRightIcon } from "@navikt/aksel-icons";

const SectionPage = ({
  pageName,
  heading,
  backgroundImage,
  backgroundHexColor,
  themePageArea,
  themePageLinks,
  goToLinkText,
  goToLinkLocation,
  themeArea,
  bottomArea,
}: SectionPageViewModel) => {
  return (
    <section id="content" className="legacy-page" tabIndex={-1}>
      {/* Page Title Section */}
      <div className="container">
        <div className="row">
          <div className="col-lg-11 offset-lg-1">
            {/* {breadcrumb && <BreadcrumbsView {...breadcrumb} />} */}
            <h1 className="a-fontBold a-pageTitle pb-1" style={{ fontWeight: "bold" }}>{pageName}</h1>
          </div>
        </div>
      </div>

      {/* Jumbotron Section */}
      <div className="container-fluid">
        <div
          className="jumbotron jumbotron-fluid a-jumbotron a-jumbotron-top a-jumbotron-light"
          style={{
            backgroundColor: `#${backgroundHexColor || "ffffff"}`,
            ...(backgroundImage?.src
              ? { backgroundImage: `url(${backgroundImage.src})` }
              : {}),
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
          }}
        >
          <div className="container">
            <div className="row">
              <div className="col-md-8 offset-md-0 col-lg-6 offset-lg-1 col-xl-5 offset-xl-1">
                {heading && <h2 className="a-fontMedium">{heading}</h2>}
                {/* Theme Page List (legacy list of links) */}
                {themePageLinks && themePageLinks.length > 0 ? (
                  <div className="a-list-container pb-3">
                    <ul className="a-list a-list-large-forMD a-list-noIcon">
                      {themePageLinks.map((link, idx) => (
                        <li
                          className="a-dotted a-clickable a-list-hasRowLink"
                          key={link.url || link.text || idx}
                        >
                          <a
                            href={link.url || "#"}
                            className="a-list-rowLink"
                          >
                            <div className="row">
                              <div className="col">{link.text}</div>
                            </div>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  themePageArea && (
                    <div className="a-list-container pb-3">
                      <ContentArea {...themePageArea} />
                    </div>
                  )
                )}

                {/* Featured Link */}
                {goToLinkLocation?.url && goToLinkText && (
                  <a
                    href={goToLinkLocation.url}
                    className="a-linkFeatured a-link-large"
                  >
                    {goToLinkText}
                    {/* <ArrowRightIcon aria-hidden="true" /> */}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Accordion Area */}
      <div className="container">
        <div className="row">
          <div className="col-sm-12">
            {themeArea && (
              <div
                className="a-accordion-large"
                id="ThemeAccordion"
                role="tablist"
                aria-multiselectable="true"
              >
                <ContentArea {...themeArea} />
              </div>
            )}
          </div>
        </div>

        {/* Bottom Area */}
        {bottomArea && (
          <div className="row">
            <div className="col-sm-12 sectionpage-bottomarea">
              <ContentArea {...bottomArea} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default SectionPage;
