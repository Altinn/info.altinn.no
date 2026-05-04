import { Alert } from "@altinn/altinn-components";
import "./OperationalMessageArticlePage.scss";

const OperationalMessageArticlePage = ({
  pageName,
  isCritical,
  colorVariant,
  mainBody,
  linkUrl,
  linkText,
}: any) => {
  const variant = colorVariant || (isCritical ? "danger" : "warning");

  return (
    <Alert
      variant={variant}
      heading={pageName || ""}
      message={mainBody}
    >
      {linkUrl && linkText && <a href={linkUrl}>{linkText}</a>}
    </Alert>
  );
};

export default OperationalMessageArticlePage;
