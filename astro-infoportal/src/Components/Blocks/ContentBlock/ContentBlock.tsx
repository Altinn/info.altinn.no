import { ContentBlockViewModel } from "/Models/Generated/ContentBlockViewModel";
import { RichTextArea } from "/App.Components";

const ContentBlock = ({ content }: ContentBlockViewModel) => {
  return content ? <RichTextArea {...content} /> : null;
};

export default ContentBlock;
