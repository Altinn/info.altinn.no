import { Alert } from "@altinn/altinn-components";

const OperationalMessage = ({
  pageName,
  message,
  url,
  urlText,
  colorVariant,
}: any) => {
  const variant = colorVariant || "warning";
  const body = message ?? "";
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
