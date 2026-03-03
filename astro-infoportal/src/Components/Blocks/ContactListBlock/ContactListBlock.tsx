import { ArticleContact } from "@altinn/altinn-components";
import { EnvelopeOpenIcon, PhoneIcon } from "@navikt/aksel-icons";
import { useState } from "react";
import { RichTextArea } from "/App.Components";
import { ContactListBlockViewModel } from "/Models/Generated/ContactListBlockViewModel";
import ContactFormModal from "../../ContactFormModal/ContactFormModal";

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
}: ContactListBlockViewModel) => {
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);
  const items = [];
  if (contactNumber && contactNumberText) {
    items.push({
      icon: PhoneIcon,
      label: contactNumber,
      href: `tel:+47${contactNumber.replace(/\s/g, "")}`,
      as: "a" as const
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
      <ArticleContact
        title={contactHeading}
        items={items}
        description=""
        theme="surface"
        color="company"
      >
        {text && <RichTextArea {...text} />}
      </ArticleContact>

      <ContactFormModal
        isOpen={isContactFormOpen}
        onClose={() => setIsContactFormOpen(false)}
        formTypeArea={contactFormPageData?.formTypeArea}
        teaserText={contactFormPageData?.teaserText}
        teaserHeading={contactFormPageData?.teaserHeading}
        useRecaptcha={contactFormPageData?.useRecaptcha ?? useRecaptcha}
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
