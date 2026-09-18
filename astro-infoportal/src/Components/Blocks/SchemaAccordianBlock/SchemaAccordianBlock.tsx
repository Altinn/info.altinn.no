import { Details } from "@digdir/designsystemet-react";
import { RichTextArea } from "/App.Components";
import { UiText } from "../../Shared/UiLanguage/UiLanguage";

const SchemaAccordianBlock = ({
  heading,
  translatedHeading,
  description,
}: any) => {
  return (
    <Details variant="default" data-color="neutral" data-size="md">
      <Details.Summary role="button" tabIndex={0} slot="summary">
        {/* `heading` is the editor's own, in the language of the article;
            `translatedHeading` is interface text (issue #713). */}
        {heading ?? <UiText>{translatedHeading}</UiText>}
      </Details.Summary>
      <Details.Content>
        {description && <RichTextArea {...description} />}
      </Details.Content>
    </Details>
  );
};

export default SchemaAccordianBlock;
