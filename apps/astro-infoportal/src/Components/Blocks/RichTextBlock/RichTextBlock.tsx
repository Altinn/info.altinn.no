import RichTextArea from "../../Shared/RichTextArea/RichTextArea";
import "./RichTextBlock.scss";

const RichTextBlock = ({ text }: any) => {
  return text ? <RichTextArea {...text} /> : null;
};

export default RichTextBlock;
