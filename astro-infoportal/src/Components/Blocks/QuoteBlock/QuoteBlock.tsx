import { QuoteBlockViewModel } from "/Models/Generated/QuoteBlockViewModel";
import "./QuoteBlock.scss";

const QuoteBlock = ({ quote, author }: QuoteBlockViewModel) => {
  return (
    <blockquote className="a-blockquote a-article-right-off a-blockquote-right">
      <p className="">{quote || ""}</p>
      <cite className="a-citation">{author || ""}</cite>
    </blockquote>
  );
};

export default QuoteBlock;
