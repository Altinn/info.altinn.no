import type { PlainLinkBlockViewModel } from "/Models/Generated/PlainLinkBlockViewModel";
import "../../../styles/legacy-pages.scss";

const PlainLinkBlock = ({
  linkText,
  url,
  openInNewWindow,
}: PlainLinkBlockViewModel) => {
  if (!linkText || !url) {
    return null;
  }

  return (
    <div className="legacy-page">
      <a
        href={url}
        className="a-linkFeatured"
        target={openInNewWindow ? "_blank" : undefined}
        rel={openInNewWindow ? "noopener noreferrer" : undefined}
      >
        {linkText}
      </a>
    </div>
  );
};

export default PlainLinkBlock;
