import { DownloadIcon } from "@navikt/aksel-icons";
import "../../../styles/legacy-pages.scss";

const LinkBlock = ({
  fullWidth,
  // icon,
  extraTitle,
  link,
}: any) => {
  if (!link?.linkText || !link?.url) {
    return null;
  }

  const containerClasses = [
    "a-iconText",
    "a-iconText-p0",
    "a-iconText-shadow",
    "a-iconText-background",
    "a-iconText-background--white",
    fullWidth
      ? "a-iconText-minusBothMargins mt-4 mb-4"
      : "a-article-right-off mb-2",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="legacy-page">
      <div className={containerClasses}>
        <div className="a-iconText-icon">
          <DownloadIcon aria-hidden="true" />
        </div>
        <div className="a-iconText-text">
          {!fullWidth && extraTitle && (
            <p className="a-iconText-text-small">{extraTitle}</p>
          )}
          <a
            href={link.url}
            className="a-linkFeatured"
            target={link.openInNewWindow ? "_blank" : undefined}
            rel={link.openInNewWindow ? "noopener noreferrer" : undefined}
          >
            {link.linkText}
          </a>
        </div>
      </div>
    </div>
  );
};

export default LinkBlock;
