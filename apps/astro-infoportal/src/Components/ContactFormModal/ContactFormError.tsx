import React from "react";

interface ContactFormErrorProps {
  onRetry: () => void;
  onClose: () => void;
  errorMessage: string;
  closeButtonText: string;
  retryButtonText: string;
}

const ContactFormError: React.FC<ContactFormErrorProps> = ({
  onRetry,
  onClose,
  errorMessage,
  closeButtonText,
  retryButtonText,
}) => {
  return (
    <div className="contact-form-error" role="alert" aria-live="assertive">
      <div className="contact-form-error__icon" aria-hidden="true">
        ✖
      </div>

      <p className="contact-form-error__message">{errorMessage || ""}</p>

      <div className="contact-form-error__buttons">
        <button type="button" onClick={onRetry} className="contact-form-error__retry">
          {retryButtonText || ""}
        </button>
        <button type="button" onClick={onClose} className="contact-form-error__close">
          {closeButtonText || ""}
        </button>
      </div>
    </div>
  );
};

export default ContactFormError;
