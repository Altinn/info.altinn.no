import { Button } from "@digdir/designsystemet-react";
import * as AkselIcons from "@navikt/aksel-icons";

import "./LinkButtonBlock.scss";

const LinkButtonBlock = ({
  link,
  icon,
  buttonType,
}: any) => {
  if (!link?.url || !link?.text) return null;

  const isExternal = /^https?:\/\//i.test(link.url);

  const getButtonVariant = () => {
    if (!buttonType) return "secondary";
    switch (buttonType.toLowerCase()) {
      case "primary":
        return "primary";
      case "secondary":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const hasCustomIcon = icon && (AkselIcons as any)[icon];
  const CustomIcon = hasCustomIcon ? (AkselIcons as any)[icon] : null;

  return (
    <Button data-size="lg" variant={getButtonVariant()} asChild>
      <a
        href={link.url}
        rel={isExternal ? "noopener noreferrer" : undefined}
        className="link-button"
      >
        {CustomIcon && <CustomIcon aria-hidden />}
        <span>{link.text}</span>
        <AkselIcons.EnterIcon aria-hidden className="link-button__icon" />
      </a>
    </Button>
  );
};

export default LinkButtonBlock;
