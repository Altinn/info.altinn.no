import { GenericMediaViewModel } from "/Models/Generated/GenericMediaViewModel";
import "./GenericMedia.scss";

const GenericMedia = ({ src, name, description }: GenericMediaViewModel) => {
  return (
    <div className="generic-media">
      <a
        href={src || "#"}
        className="generic-media__link"
        download={name || ""}
      >
        <i className="ai ai-download" aria-hidden="true" />
        <span className="generic-media__name">{name || ""}</span>
      </a>
      {description && (
        <p className="generic-media__description">{description}</p>
      )}
    </div>
  );
};

export default GenericMedia;
