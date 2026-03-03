import { Details } from "@digdir/designsystemet-react";
import { RichTextArea } from "/App.Components";
import type { SchemaAccordianBlockViewModel } from "/Models/Generated/SchemaAccordianBlockViewModel";

const SchemaAccordianBlock = ({
  heading,
  translatedHeading,
  description,
}: SchemaAccordianBlockViewModel) => {
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
