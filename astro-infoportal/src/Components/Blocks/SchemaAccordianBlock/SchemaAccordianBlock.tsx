import { Details } from "@digdir/designsystemet-react";
import { RichTextArea } from "/App.Components";

const SchemaAccordianBlock = ({
  heading,
  translatedHeading,
  description,
}: any) => {
  return (
    <Details variant="default" data-color="neutral" data-size="md">
      <Details.Summary role="button" tabIndex={0} slot="summary">
        {heading ?? translatedHeading}
      </Details.Summary>
      <Details.Content>
        {description && <RichTextArea {...description} />}
      </Details.Content>
    </Details>
  );
};

export default SchemaAccordianBlock;
