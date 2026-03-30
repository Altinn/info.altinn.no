import { ArticleContact } from "@altinn/altinn-components";
import { RichTextArea } from "/App.Components";

const ProviderContactInformationBlock = ({
  heading,
  body,
}: any) => {

  return (
    <ArticleContact
      title={heading}
      items={[]}
      description=""
      theme="surface"
      color="company"
    >
      {body && <RichTextArea {...body} />}
    </ArticleContact>
  );
};

export default ProviderContactInformationBlock;
