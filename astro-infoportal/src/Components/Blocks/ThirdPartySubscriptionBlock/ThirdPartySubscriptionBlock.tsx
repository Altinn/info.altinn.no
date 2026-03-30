import { Button } from "@digdir/designsystemet-react";

const ThirdPartySubscriptionBlock = ({
  buttonText,
  buttonUrl,
}: any) => {
  if (!buttonUrl || !buttonText) {
    return null;
  }

  const isExternal = /^https?:\/\//i.test(buttonUrl);

  return (
    <Button variant="primary" asChild>
      <a
        href={buttonUrl}
        rel={isExternal ? "noopener noreferrer" : undefined}
        target={isExternal ? "_blank" : undefined}
      >
        {buttonText}
      </a>
    </Button>
  );
};

export default ThirdPartySubscriptionBlock;
