import { RichTextProps } from "/Models/Generated/RichTextProps";
import "./RichText.scss";

const RichText = ({ html }: RichTextProps) => {

  return (
    <div className="rich-text" dangerouslySetInnerHTML={{ __html: html }} />
  );
};

export default RichText;
