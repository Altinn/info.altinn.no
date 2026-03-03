import type { VectorImageBlockViewModel } from "/Models/Generated/VectorImageBlockViewModel";
import "../../../styles/legacy-pages.scss";
import "./VectorImageBlock.scss";

const VectorImageBlock = ({
  vectorImage,
  altText,
  caption,
  backgroundColor,
}: VectorImageBlockViewModel) => {
  if (!vectorImage || !vectorImage.src) {
    return null;
  }

  const containerStyle = backgroundColor
    ? { backgroundColor }
    : undefined;

  return (
    <div className="legacy-page">
      <div className="vector-image-block" style={containerStyle}>
        <div className="vector-image-wrapper">
          <img
            src={vectorImage.src}
            alt={altText || vectorImage.altText || ""}
            className="vector-image"
          />
        </div>
        {caption && (
          <div className="vector-image-caption">
            {caption}
          </div>
        )}
      </div>
    </div>
  );
};

export default VectorImageBlock;
