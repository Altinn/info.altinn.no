import { ArticleContact } from "@altinn/altinn-components";
import { RichTextArea } from "/App.Components";
import { ProviderContactInformationBlockViewModel } from "/Models/Generated/ProviderContactInformationBlockViewModel";

const ProviderContactInformationBlock = ({
  heading,
  body,
}: ProviderContactInformationBlockViewModel) => {

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
