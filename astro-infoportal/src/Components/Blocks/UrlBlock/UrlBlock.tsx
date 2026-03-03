import { DsLink } from "@altinn/altinn-components";
import type { UrlBlockViewModel } from "/Models/Generated/UrlBlockViewModel";

const UrlBlock = ({
  linkText,
  url,
  openInNewWindow,
}: UrlBlockViewModel) => {
  if (!url || !linkText) {
    return null;
  }

  return (
    <DsLink href={url} target={openInNewWindow ? "_blank" : undefined}>
      {linkText}
    </DsLink>
  );
};

export default UrlBlock;
