import { Alert } from "@altinn/altinn-components";
import { OperationalMessageArticlePageViewModel } from "/Models/Generated/OperationalMessageArticlePageViewModel";
import "./OperationalMessageArticlePage.scss";

const OperationalMessageArticlePage = ({
  pageName,
  isCritical,
  mainBody,
  // linkUrl,
  // linkText,
}: OperationalMessageArticlePageViewModel) => {


  return (
    <Alert
      variant={isCritical ? "danger" : "warning"}
      heading={pageName || ""}
      message={mainBody}
    />
  );
};

export default OperationalMessageArticlePage;
