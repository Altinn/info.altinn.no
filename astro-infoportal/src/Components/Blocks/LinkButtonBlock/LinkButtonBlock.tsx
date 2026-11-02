import { EnterIcon } from "@components/Shared/Icons/icons";
import { resolveIcon } from "@components/Shared/Icons/resolveIcon";

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

  const CustomIcon = resolveIcon(icon);
  const btnVariant = getButtonVariant();

  return (
    <a
      href={link.url}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className={`btn-card--startpage${btnVariant === "secondary" ? " btn-card--startpage--secondary" : ""}`}
      data-size="lg"
    >
      {CustomIcon && <CustomIcon aria-hidden />}
      <span>{link.text}</span>
      <EnterIcon aria-hidden className="btn-card__icon" />
    </a>
  );
};

export default LinkButtonBlock;
