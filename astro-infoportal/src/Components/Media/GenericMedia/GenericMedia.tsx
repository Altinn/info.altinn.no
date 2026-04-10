import "./GenericMedia.scss";

const GenericMedia = ({ src, name, description }: any) => {
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
