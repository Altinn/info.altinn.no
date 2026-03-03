import { Card, Heading } from "@digdir/designsystemet-react";
import { CampaignBlockViewModel } from "/Models/Generated/CampaignBlockViewModel";
import RichTextArea from "../../Shared/RichTextArea/RichTextArea";
import "./CampaignBlock.scss";

const CampaignBlock = ({ link, description }: CampaignBlockViewModel) => {
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
