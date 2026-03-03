import { Details } from "@digdir/designsystemet-react";
import { RichTextArea } from "/App.Components";
import type { AccordionBlockViewModel} from "/Models/Generated/AccordionBlockViewModel";

const AccordionBlock = ({
  heading,
  description,
}: AccordionBlockViewModel) => {    
  return (
    <Details variant="default" data-color="neutral" data-size="md">
      <Details.Summary role="button" tabIndex={0} slot="summary">
        {heading}
      </Details.Summary>
      <Details.Content>
        {description && <RichTextArea {...description} />}
      </Details.Content>
    </Details>
  );
};

export default AccordionBlock;