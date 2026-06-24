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
  // Alert always renders its heading as an <h2>; normalise blank/whitespace/
  // &nbsp; titles to "" so the empty-heading CSS net hides it (issue #530).
  const heading = (pageName ?? "").trim();

  return (
    <Alert variant={variant} heading={heading} message={body}>
      {url && urlText && <a href={url}>{urlText}</a>}
    </Alert>
  );
};

export default OperationalMessage;
