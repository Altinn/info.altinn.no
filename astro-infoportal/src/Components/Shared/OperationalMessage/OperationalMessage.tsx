import { Alert } from "@altinn/altinn-components";

const OperationalMessage = ({
  pageName,
  message,
  mainBody,
  url,
  urlText,
  isCritical,
  colorVariant,
}: any) => {
  const variant = colorVariant || (isCritical ? "danger" : "warning");
  const body = message ?? mainBody ?? "";

  return (
    <Alert
      variant={variant}
      heading={pageName || ""}
      message={body}
    >
      {url && urlText && <a href={url}>{urlText}</a>}
    </Alert>
  );
};

export default OperationalMessage;
