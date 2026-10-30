import { MobileIcon, PaperplaneIcon } from "@navikt/aksel-icons";
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
  contactPageUrl,
}: any) => {
  const phoneHref = phoneNumber
    ? `tel:+47${digitsOnly(phoneNumber)}`
    : undefined;

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

            {showContactFormButton && contactPageUrl && (
              <a href={contactPageUrl} className="a-linkIcon">
                <PaperplaneIcon aria-hidden="true" />
                <span className="a-linkIcon-text">{contactFormText}</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoYouNeedHelpBlock;
