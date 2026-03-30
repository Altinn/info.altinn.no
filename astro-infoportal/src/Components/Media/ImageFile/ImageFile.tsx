import "./ImageFile.scss";

const ImageFile = ({ src, altText }: any) => {
  return (
    <img
      src={src || ""}
      alt={altText || ""}
      className="image-file"
    />
  );
};

export default ImageFile;
