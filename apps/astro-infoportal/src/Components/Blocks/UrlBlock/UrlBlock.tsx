import { DsLink } from "@altinn/altinn-components";

const UrlBlock = ({
  linkText,
  url,
  openInNewWindow,
}: any) => {
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
