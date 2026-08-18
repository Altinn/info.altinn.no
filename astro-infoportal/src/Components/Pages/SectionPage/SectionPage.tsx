import { ContentArea } from "/App.Components";
// import BreadcrumbsView from "../../Layout/Breadcrumbs/BreadcrumbsView";
import "../../../styles/legacy-pages.scss";
import "./SectionPage.scss";
import { ArrowRightIcon } from "@navikt/aksel-icons";
import type { SectionPageProps } from "./SectionPage.types";

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
}: SectionPageProps) => {
  /*
    Split the featured link label so the last word can carry the arrow inside a
    nowrap span. A line break is allowed before an atomic inline even with no
    whitespace in between, so without this the arrow wraps onto a line of its own
    once the label spans two lines.
  */
  const featuredLinkWords = goToLinkText?.trim().split(/\s+/) ?? [];
  const featuredLinkLastWord = featuredLinkWords.pop();
  const featuredLinkLead = featuredLinkWords.join(" ");

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
          {/*
            Small screens render the illustration as a real image so it scales to
            the viewport width and the link list flows below it instead of on top
            of it. From md up the illustration stays a full-bleed background and
            this image is hidden (see SectionPage.scss).
          */}
          {backgroundImage?.src && (
            <img
              className="sectionpage-illustration"
              src={backgroundImage.src}
              alt=""
            />
          )}
          <div className="container">
            <div className="row">
              <div className="col-md-8 offset-md-0 col-lg-6 offset-lg-1 col-xl-5 offset-xl-1">
                {heading && <h2 className="a-fontMedium">{heading}</h2>}
                {/* Theme Page List (legacy list of links) */}
                {themePageLinks && themePageLinks.length > 0 ? (
                  <div className="a-list-container pb-3">
                    <ul className="a-list a-list-large-forMD a-list-noIcon">
                      {themePageLinks.map((link: any, idx: number) => (
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
                    className="a-linkFeatured a-link-large sectionpage-featuredlink"
                  >
                    {featuredLinkLead && `${featuredLinkLead} `}
                    <span className="sectionpage-featuredlink__end">
                      {featuredLinkLastWord}
                      <ArrowRightIcon aria-hidden="true" fontSize="1.25em" />
                    </span>
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
