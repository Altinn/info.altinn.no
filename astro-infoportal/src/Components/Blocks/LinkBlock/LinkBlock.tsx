import { DownloadIcon } from "@navikt/aksel-icons";
import "../../../styles/legacy-pages.scss";

const LinkBlock = ({
  fullWidth,
  // icon,
  extraTitle,
  link,
  urlBlock,
}: any) => {
  // Legacy Optimizely shape supplied a built `link` view-model. Umbraco's
  // RichTextPropertyConverter instead exposes the raw picker as `urlBlock`
  // (array). Accept either; pick the first populated item.
  const resolved =
    link ?? (Array.isArray(urlBlock) ? urlBlock[0] : urlBlock);
  if (!resolved?.linkText || !resolved?.url) {
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
            href={resolved.url}
            className="a-linkFeatured"
            target={resolved.openInNewWindow ? "_blank" : undefined}
            rel={resolved.openInNewWindow ? "noopener noreferrer" : undefined}
          >
            {resolved.linkText}
          </a>
        </div>
      </div>
    </div>
  );
};

export default LinkBlock;
