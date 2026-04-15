import { Heading } from "@altinn/altinn-components";
import { EnvelopeOpenIcon, PhoneIcon } from "@navikt/aksel-icons";
import { useState } from "react";
import { RichTextArea } from "/App.Components";
import ContactFormModal from "../../ContactFormModal/ContactFormModal";
import type { ContactCardItem } from "../../Shared/ContactCard/ContactCard";
import ContactCard from "../../Shared/ContactCard/ContactCard";
import type { ContactListBlockProps } from "./ContactListBlock.types";

const ContactListBlock = ({
  contactHeading,
  text,
  contactNumberText,
  contactNumber,
  contactFormLocation,
  contactFormPageData,
  contactFormSchemaId,
  showAttachment,
  useRecaptcha,
  recaptchaSiteKey,
  labels,
}: ContactListBlockProps) => {
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);
  const items: ContactCardItem[] = [];
  if (contactNumber && contactNumberText) {
    items.push({
      icon: PhoneIcon,
      label: contactNumber,
      href: `tel:+47${contactNumber.replace(/\s/g, "")}`,
    });
  }

  if (contactFormLocation?.text) {
    items.push({
      icon: EnvelopeOpenIcon,
      label: contactFormLocation.text,
      onClick: () => {
        setIsContactFormOpen(true);
      },
    });
  }

  return (
    <>
      <ContactCard items={items}>
        {contactHeading && <Heading size="lg">{contactHeading}</Heading>}
        {text && <RichTextArea {...text} />}
      </ContactCard>

      <ContactFormModal
        isOpen={isContactFormOpen}
        onClose={() => setIsContactFormOpen(false)}
        formTypeArea={contactFormPageData?.formTypeArea}
        teaserText={contactFormPageData?.teaserText}
        teaserHeading={contactFormPageData?.teaserHeading}
        useRecaptcha={contactFormPageData?.useRecaptcha ?? useRecaptcha ?? false}
        recaptchaSiteKey={
          contactFormPageData?.recaptchaSiteKey ?? recaptchaSiteKey
        }
        title={
          contactFormPageData?.pageName ||
          contactHeading ||
          contactFormLocation?.text ||
          ""
        }
        schemaId={!contactFormPageData ? contactFormSchemaId : undefined}
        showAttachment={!contactFormPageData ? showAttachment : undefined}
        labels={labels}
      />
    </>
  );
};

export default ContactListBlock;
