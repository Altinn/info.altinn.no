import { ImageProps } from "/Models/Generated/ImageProps";
import "./Image.scss";

const Image = ({ imageSources, altText, description, src }: ImageProps) => {
  const hasSources = Array.isArray(imageSources) && imageSources.length > 0;
  const resolvedSrc = hasSources ? imageSources[0]?.srcSet : src;

  if (!hasSources && !resolvedSrc) {
    return null;
  }

  return (
    <figure className="image">
      <picture>
        {imageSources?.map((val, idx) => (
          <source key={idx} media={val.media} srcSet={val.srcSet} />
        ))}
        {resolvedSrc && (
          <img src={resolvedSrc} alt={altText ?? ""} loading="lazy" />
        )}
      </picture>

      {description && (
        <figcaption>
          <p className="image__caption">{description}</p>
        </figcaption>
      )}
    </figure>
  );
};

export default Image;
