import { Alert } from "@altinn/altinn-components";
import { OperationalMessageViewModel } from "/Models/Generated/OperationalMessageViewModel";

const OperationalMessage = ({
  pageName,
  message,
  // url,
  // urlText,
  isCritical
}: OperationalMessageViewModel) => {
  return (
    <Alert
      variant={isCritical ? "danger" : "warning"}
      heading={pageName || ""}
      message={message}
    />
  );
};

export default OperationalMessage;
