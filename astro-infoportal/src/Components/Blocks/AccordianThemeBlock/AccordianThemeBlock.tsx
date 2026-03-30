import { useState } from "react";
import { ContentArea } from "/App.Components";
import "./AccordianThemeBlock.scss";
import "../../../styles/legacy-pages.scss";

const AccordianThemeBlock = ({
  heading,
  themePageArea,
  goToLinkLocation,
  goToLinkText,
  image,
}: any) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="legacy-page card">
      <div className="card-header">
        <button
          type="button"
          onClick={toggleExpanded}
          aria-expanded={isExpanded}
          className="accordion-button"
        >
          {heading}
          <span className="accordion-icon" aria-hidden="true">
            {isExpanded ? "−" : "+"}
          </span>
        </button>
      </div>
      <div className={`a-collapseContent collapse ${isExpanded ? "show" : ""}`}>
        <div className="accordion-body">
          {themePageArea && <ContentArea {...themePageArea} />}

          {goToLinkLocation && goToLinkText && (
            <a href={goToLinkLocation.url} className="a-linkFeatured a-link-large">
              {goToLinkText}
              <i className="ai ai-sm ai-nw ai-nw-right ai-arrowright" aria-hidden="true"></i>
            </a>
          )}

          {image?.src && (
            <div className="accordion-image">
              <img src={image.src} alt={image.altText || ""} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccordianThemeBlock;
