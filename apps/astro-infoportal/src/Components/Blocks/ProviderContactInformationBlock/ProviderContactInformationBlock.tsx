import {
  type AvatarProps,
  Divider,
  Heading,
  ListItemIcon,
} from "@altinn/altinn-components";
import { EnvelopeOpenIcon, GlobeIcon, PhoneIcon } from "@navikt/aksel-icons";
import { RichTextArea } from "/App.Components";
import type { ContactCardItem } from "../../Shared/ContactCard/ContactCard";
import ContactCard from "../../Shared/ContactCard/ContactCard";
import type { ProviderContactInformationBlockProps } from "./ProviderContactInformationBlock.types";
import "./ProviderContactInformationBlock.scss";

const ProviderContactInformationBlock = ({
  body,
  bottomText,
  webpageLink,
  telephone,
  telephoneLabel,
  email,
  emailTitle,
  pageName,
  providerIcon,
}: ProviderContactInformationBlockProps) => {
  const providerAvatar: AvatarProps | null = providerIcon?.name
    ? {
        name: providerIcon.name,
        imageUrl: providerIcon.imageUrl || "",
        type: "company",
      }
    : null;

  const items: ContactCardItem[] = [];

  if (webpageLink?.url) {
    items.push({
      icon: GlobeIcon,
      label: webpageLink.text || webpageLink.url,
      href: webpageLink.url,
    });
  }

  if (telephone) {
    items.push({
      icon: PhoneIcon,
      label: telephoneLabel || telephone,
      href: `tel:${telephone.replace(/\s/g, "")}`,
    });
  }

  if (email) {
    items.push({
      icon: EnvelopeOpenIcon,
      label: emailTitle || email,
      href: `mailto:${email}`,
    });
  }

  return (
    <div className="provider-contact-info">
      <ContactCard items={items}>
        <Heading size="lg" as="h2" className="provider-contact-info__heading">
          {providerAvatar && <ListItemIcon icon={providerAvatar} />}
          {pageName || ""}
        </Heading>

        {body && (
          <div className="provider-contact-info__body">
            <RichTextArea {...body} />
          </div>
        )}

        {(bottomText || items.length > 0) && <Divider />}

        {bottomText && (
          <div className="provider-contact-info__subtle">
            <RichTextArea {...bottomText} />
          </div>
        )}
      </ContactCard>
    </div>
  );
};

export default ProviderContactInformationBlock;
