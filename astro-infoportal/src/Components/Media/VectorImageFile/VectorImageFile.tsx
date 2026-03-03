import type { VectorImageFileViewModel } from "/Models/Generated/VectorImageFileViewModel";
import "../../../styles/legacy-pages.scss";
import "./VectorImageFile.scss";

const VectorImageFile = ({
  src,
  altText,
  backgroundColor,
}: VectorImageFileViewModel) => {
  if (!src) {
    return null;
  }

  const containerStyle = backgroundColor
    ? { backgroundColor }
    : undefined;

  return (
    <div className="legacy-page">
      <div className="vector-image-file" style={containerStyle}>
        <img
          src={src}
          alt={altText || ""}
          className="vector-image"
        />
      </div>
    </div>
  );
};

export default VectorImageFile;
