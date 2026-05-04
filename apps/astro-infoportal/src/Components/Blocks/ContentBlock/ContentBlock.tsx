import { RichTextArea } from "/App.Components";

const ContentBlock = ({ content }: any) => {
  return content ? <RichTextArea {...content} /> : null;
};

export default ContentBlock;
