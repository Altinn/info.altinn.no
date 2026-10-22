import { Details } from "@digdir/designsystemet-react";
import { RichTextArea } from "/App.Components";

const AccordionBlock = ({
  heading,
  description,
  headingLevel,
  headingClassName,
}: any) => {
  // Optional heading element inside <summary>, e.g. h3 on HelpPage
  const HeadingTag = headingLevel;
  return (
    <Details variant="default" data-color="neutral" data-size="md">
      <Details.Summary>
        {HeadingTag ? (
          <HeadingTag className={headingClassName}>{heading}</HeadingTag>
        ) : (
          heading
        )}
      </Details.Summary>
      <Details.Content>
        {description && <RichTextArea {...description} />}
      </Details.Content>
    </Details>
  );
};

export default AccordionBlock;
