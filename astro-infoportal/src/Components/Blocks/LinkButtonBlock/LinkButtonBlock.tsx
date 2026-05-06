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
      <AkselIcons.EnterIcon aria-hidden className="btn-card__icon" />
    </a>
  );
};

export default LinkButtonBlock;
