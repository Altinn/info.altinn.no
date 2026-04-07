import { Alert } from "@altinn/altinn-components";

const OperationalMessage = ({
  pageName,
  message,
  // url,
  // urlText,
  isCritical
}: any) => {
  return (
    <Alert
      variant={isCritical ? "danger" : "warning"}
      heading={pageName || ""}
      message={message}
    />
  );
};

export default OperationalMessage;
