import "../../../styles/legacy-pages.scss";

const PlainLinkBlock = ({
  linkText,
  url,
  openInNewWindow,
}: any) => {
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
