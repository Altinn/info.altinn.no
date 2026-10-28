import { Heading } from "@altinn/altinn-components";
import { EnvelopeOpenIcon, PhoneIcon } from "@navikt/aksel-icons";
import { RichTextArea } from "/App.Components";
import type { ContactCardItem } from "../../Shared/ContactCard/ContactCard";
import ContactCard from "../../Shared/ContactCard/ContactCard";
import type { ContactListBlockProps } from "./ContactListBlock.types";

const ContactListBlock = ({
  contactHeading,
  text,
  contactNumberText,
  contactNumber,
  contactFormLocation,
  contactPageUrl,
}: ContactListBlockProps) => {
  const items: ContactCardItem[] = [];
  if (contactNumber && contactNumberText) {
    items.push({
      icon: PhoneIcon,
      label: contactNumber,
      href: `tel:+47${contactNumber.replace(/\s/g, "")}`,
    });
  }

  if (contactFormLocation?.text && contactPageUrl) {
    items.push({
      icon: EnvelopeOpenIcon,
      label: contactFormLocation.text,
      href: contactPageUrl,
    });
  }

  return (
    <ContactCard items={items}>
      {contactHeading && <Heading size="lg">{contactHeading}</Heading>}
      {text && <RichTextArea {...text} />}
    </ContactCard>
  );
};

export default ContactListBlock;
