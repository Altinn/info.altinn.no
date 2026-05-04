import { MobileIcon, PaperplaneIcon } from "@navikt/aksel-icons";
import { useState } from "react";
import ContactFormModal from "../../ContactFormModal/ContactFormModal";
import "./DoYouNeedHelpBlock.scss";
import "../../../styles/legacy-pages.scss";

const digitsOnly = (value: string) => (value || "").replace(/\D+/g, "");

const DoYouNeedHelpBlock = ({
  heading,
  image,
  imageAltText,
  description,
  phoneNumber,
  emailLinkText,
  email,
  showContactFormButton,
  contactFormText,
  contactFormPageData,
  contactFormSchemaId,
  showAttachment,
  useRecaptcha,
  recaptchaSiteKey,
  labels,
}: any) => {
  const phoneHref = phoneNumber
    ? `tel:+47${digitsOnly(phoneNumber)}`
    : undefined;
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);

  return (
    <div className="legacy-page do-you-need-help-block">
      <div className="a-card a-cardImage mt-4">
        {image && (
          <div className="a-card-media">
            <img src={image.src || ""} alt={imageAltText || ""} />
          </div>
        )}
        <div className="a-card-content">
          {heading && <h2 className="a-h3">{heading}</h2>}
          {description && <p>{description}</p>}

          <div className="contact-links">
            {phoneNumber && (
              <a href={phoneHref} className="a-linkIcon">
                <MobileIcon aria-hidden="true" />
                <span className="a-linkIcon-text">{phoneNumber}</span>
              </a>
            )}

            {email && emailLinkText && (
              <a href={`mailto:${email}`} className="a-linkIcon">
                <PaperplaneIcon aria-hidden="true" />
                <span className="a-linkIcon-text">{emailLinkText}</span>
              </a>
            )}

            {showContactFormButton && (
              <>
                <button
                  type="button"
                  onClick={() => setIsContactFormOpen(true)}
                  className="a-linkIcon do-you-need-help-block__linkbutton"
                  aria-label={contactFormText || "Open contact form modal"}
                >
                  <PaperplaneIcon aria-hidden="true" />
                  <span className="a-linkIcon-text">
                    {contactFormText || ""}
                  </span>
                </button>

                <ContactFormModal
                  isOpen={isContactFormOpen}
                  onClose={() => setIsContactFormOpen(false)}
                  formTypeArea={contactFormPageData?.formTypeArea}
                  teaserText={contactFormPageData?.teaserText}
                  teaserHeading={contactFormPageData?.teaserHeading}
                  useRecaptcha={
                    contactFormPageData?.useRecaptcha ?? useRecaptcha
                  }
                  recaptchaSiteKey={
                    contactFormPageData?.recaptchaSiteKey ?? recaptchaSiteKey
                  }
                  title={
                    contactFormPageData?.pageName ||
                    contactFormText ||
                    heading ||
                    ""
                  }
                  schemaId={
                    !contactFormPageData ? contactFormSchemaId : undefined
                  }
                  showAttachment={
                    !contactFormPageData ? showAttachment : undefined
                  }
                  labels={labels}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoYouNeedHelpBlock;
