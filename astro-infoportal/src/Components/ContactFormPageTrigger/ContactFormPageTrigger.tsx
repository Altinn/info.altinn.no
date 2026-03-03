import { useState } from "react";
import ContactFormModal from "../ContactFormModal/ContactFormModal";
import { ContactFormPageViewModel } from "/Models/Generated/ContactFormPageViewModel";

interface ContactFormPageTriggerProps {
  contactFormUrl: string;
}

const ContactFormPageTrigger = ({ contactFormUrl }: ContactFormPageTriggerProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pageData, setPageData] = useState<ContactFormPageViewModel | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    if (pageData) {
      setIsModalOpen(true);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/ContactFormPage/GetPageData?url=${encodeURIComponent(contactFormUrl)}`
      );

      if (!response.ok) {
        throw new Error("Failed to load contact form");
      }

      const data: ContactFormPageViewModel = await response.json();
      setPageData(data);
      setIsModalOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Failed to load contact form:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        id="contact-form-link"
        type="button"
        className="a-linkIcon"
        onClick={handleClick}
        disabled={isLoading}
        style={{ display: "none" }}
      >
        <span className="sr-only">{isLoading ? "Loading..." : "Open contact form"}</span>
      </button>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {pageData && (
        <ContactFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          formTypeArea={pageData.formTypeArea}
          teaserText={pageData.teaserText}
          teaserHeading={pageData.teaserHeading}
          useRecaptcha={pageData.useRecaptcha}
          recaptchaSiteKey={pageData.recaptchaSiteKey}
          title={pageData.pageName}
        />
      )}
    </>
  );
};

export default ContactFormPageTrigger;
