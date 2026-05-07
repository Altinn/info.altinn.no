import { Alert, Heading } from "@digdir/designsystemet-react";
import RichTextArea from "../../Shared/RichTextArea/RichTextArea";
import "./OperationalMessageArticlePage.scss";

const OperationalMessageArticlePage = ({
  pageName,
  colorVariant,
  mainBody,
  mainBodyRichText,
}: any) => {
  return (
    <Alert data-color={colorVariant || "info"}>
      <Heading
        level={2}
        data-size="xs"
        style={{
          marginBottom: "var(--ds-size-2)",
        }}
      >
        {pageName || ""} - TEST {colorVariant}
      </Heading>
      {mainBodyRichText &&
      mainBodyRichText.items &&
      mainBodyRichText.items.length > 0 ? (
        <div className="operational-message__body">
          <RichTextArea {...mainBodyRichText} />
        </div>
      ) : (
        mainBody && (
          <div className="operational-message__body">{mainBody}</div>
        )
      )}
    </Alert>
  );
};

export default OperationalMessageArticlePage;
