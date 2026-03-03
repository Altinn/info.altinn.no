import { Button, DsLink, Typography } from "@altinn/altinn-components";
import { AlternativeLoginBlockViewModel } from "/Models/Generated/AlternativeLoginBlockViewModel";
import "./AlternativeLoginBlock.scss";

const AlternativeLoginBlock = ({
  primaryButtonIntroduction,
  primaryButtonText,
  primaryButtonTarget,
  secondaryLinkIntroduction,
  secondaryLinkText,
  secondaryLinkTarget,
  activated,
}: AlternativeLoginBlockViewModel) => {
  if (!activated) {
    return null;
  }

  return (
    <div className="alternative-login-block">
      {primaryButtonIntroduction && (
        <Typography>{primaryButtonIntroduction}</Typography>
      )}
      {primaryButtonText && primaryButtonTarget && (
        <Button as="a" href={primaryButtonTarget}>
          {primaryButtonText}
        </Button>
      )}
      {secondaryLinkIntroduction && (
        <Typography>{secondaryLinkIntroduction}</Typography>
      )}
      {secondaryLinkText && secondaryLinkTarget && (
        <DsLink href={secondaryLinkTarget}>{secondaryLinkText}</DsLink>
      )}
    </div>
  );
};

export default AlternativeLoginBlock;
