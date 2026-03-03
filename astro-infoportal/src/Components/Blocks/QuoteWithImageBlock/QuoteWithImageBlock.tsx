import { Image } from "/App.Components";
import { QuoteWithImageBlockViewModel } from "/Models/Generated/QuoteWithImageBlockViewModel";
import "./QuoteWithImageBlock.scss";

const QuoteWithImageBlock = ({
  quote,
  author,
  image,
  imageAltText,
}: QuoteWithImageBlockViewModel) => {
  return (
    <div className="media a-media mb-2">
      {image && image.src && (
        <div className="media-left">
          <Image {...image} altText={imageAltText || image.altText || ""} />
        </div>
      )}
      <div className="media-body">
        <blockquote className="a-blockquote">
          <p className="">{quote || ""}</p>
          <cite className="a-citation">{author || ""}</cite>
        </blockquote>
      </div>
    </div>
  );
};

export default QuoteWithImageBlock;
