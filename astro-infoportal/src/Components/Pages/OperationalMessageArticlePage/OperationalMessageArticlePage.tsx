import { Alert } from "@altinn/altinn-components";
import "./OperationalMessageArticlePage.scss";

const OperationalMessageArticlePage = ({
  pageName,
  isCritical,
  mainBody,
  // linkUrl,
  // linkText,
}: any) => {


  return (
    <Alert
      variant={isCritical ? "danger" : "warning"}
      heading={pageName || ""}
      message={mainBody}
    />
  );
};

export default OperationalMessageArticlePage;
