import { ImageFileViewModel } from "/Models/Generated/ImageFileViewModel";
import "./ImageFile.scss";

const ImageFile = ({ src, altText }: ImageFileViewModel) => {
  return (
    <img
      src={src || ""}
      alt={altText || ""}
      className="image-file"
    />
  );
};

export default ImageFile;
