import React, { useEffect } from "react";

interface ContactFormSuccessProps {
  onClose: () => void;
  successMessage: string;
  closeButtonText: string;
  autoCloseAfterSeconds?: number;
}

const ContactFormSuccess: React.FC<ContactFormSuccessProps> = ({
  onClose,
  successMessage,
  closeButtonText,
  autoCloseAfterSeconds = 0,
}) => {
  useEffect(() => {
    if (autoCloseAfterSeconds > 0) {
      const timer = setTimeout(onClose, autoCloseAfterSeconds * 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [autoCloseAfterSeconds, onClose]);

  return (
    <output className="contact-form-success" aria-live="polite">
      <div className="contact-form-success__icon" aria-hidden="true">
        ✔
      </div>

      <p className="contact-form-success__message">{successMessage || ""}</p>

      <button type="button" onClick={onClose} className="contact-form-success__close">
        {closeButtonText || ""}
      </button>
    </output>
  );
};

export default ContactFormSuccess;
