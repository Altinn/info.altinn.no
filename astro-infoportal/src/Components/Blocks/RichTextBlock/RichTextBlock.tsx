import { RichTextBlockViewModel } from "/Models/Generated/RichTextBlockViewModel";
import RichTextArea from "../../Shared/RichTextArea/RichTextArea";
import "./RichTextBlock.scss";

const RichTextBlock = ({ text }: RichTextBlockViewModel) => {
  return text ? <RichTextArea {...text} /> : null;
};

export default RichTextBlock;
