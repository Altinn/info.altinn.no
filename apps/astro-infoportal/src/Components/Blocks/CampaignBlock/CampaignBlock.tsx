import { Card, Heading } from "@digdir/designsystemet-react";
import RichTextArea from "../../Shared/RichTextArea/RichTextArea";
import "./CampaignBlock.scss";

const CampaignBlock = ({ link, description }: any) => {
  if (
    !link ||
    !description ||
    !description.items ||
    description.items.length === 0
  ) {
    return null;
  }

  return (
    <Card asChild data-color="neutral">
      <a href={link.url || "#"}>
        <Heading>{link.text || ""}</Heading>
        <RichTextArea {...description} />
      </a>
    </Card>
  );
};

export default CampaignBlock;
