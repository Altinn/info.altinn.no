import { Heading } from "@altinn/altinn-components";
import { useEffect, useState } from "react";
import { ContactFormBlockViewModel } from "/Models/Generated/ContactFormBlockViewModel";
import ContactForm from "../../ContactFormModal/ContactForm";
import ContactFormError from "../../ContactFormModal/ContactFormError";
import ContactFormSuccess from "../../ContactFormModal/ContactFormSuccess";

const ContactFormBlock = ({
  text,
  schemaId,
  showAttachment,
  useRecaptcha,
  recaptchaSiteKey,
  labels,
}: ContactFormBlockViewModel) => {
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSuccess = () => {
    setShowSuccess(true);
  };

  const handleError = (message: string) => {
    setErrorMessage(message || labels?.errorMessage || "An error occurred");
  };

  const handleRetry = () => {
    setErrorMessage("");
  };

  const handleClose = () => {
    setShowSuccess(false);
    setErrorMessage("");

    // Tell the modal to close
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("contactformblock:close-modal"));
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const hasError = !!errorMessage;
    window.dispatchEvent(new CustomEvent("contactformblock:has-error", { detail: { hasError } }));

    return () => {
      window.dispatchEvent(new CustomEvent("contactformblock:has-error", { detail: { hasError: false } }));
    };
  }, [errorMessage]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const hasSuccess = showSuccess;
    window.dispatchEvent(new CustomEvent("contactformblock:has-success", { detail: { hasSuccess } }));

    return () => {
      window.dispatchEvent(new CustomEvent("contactformblock:has-success", { detail: { hasSuccess: false } }));
    };
  }, [showSuccess]);

  if (showSuccess) {
    return (
      <div className="contact-form-block">
        <ContactFormSuccess
          onClose={handleClose}
          successMessage={labels?.successMessage || ""}
          closeButtonText={labels?.closeButton || ""}
        />
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="contact-form-block">
        <ContactFormError
          onRetry={handleRetry}
          onClose={handleClose}
          errorMessage={errorMessage}
          closeButtonText={labels?.closeButton || ""}
          retryButtonText={labels?.retryButton || ""}
        />
      </div>
    );
  }

  return (
    <div className="contact-form-block">
      {text && (
        <Heading as="h2" size="lg">
          {text}
        </Heading>
      )}
      
      <ContactForm
        schemaId={schemaId}
        showAttachment={showAttachment}
        useRecaptcha={useRecaptcha}
        recaptchaSiteKey={recaptchaSiteKey}
        onSuccess={handleSuccess}
        onError={handleError}
        labels={labels}
        isOpen={true}
        onClose={() => {}}
      />
    </div>
  );
};

export default ContactFormBlock;
