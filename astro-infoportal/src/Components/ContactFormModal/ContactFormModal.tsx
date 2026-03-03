import { Heading } from "@altinn/altinn-components";
import { Fieldset, Radio } from "@digdir/designsystemet-react";
import { PaperplaneIcon, XMarkIcon } from "@navikt/aksel-icons";
import { useEffect, useRef, useState } from "react";
import ContactForm from "./ContactForm";
import ContactFormError from "./ContactFormError";
import ContactFormSuccess from "./ContactFormSuccess";
import type {
  ContactFormLabels,
  ContactFormModalProps,
} from "./ContactFormTypes";
import "./ContactFormModal.scss";
import { ContentArea, RichTextArea } from "/App.Components";

type ModalState = "form" | "success" | "error";

const localization = (key: string): string => {
  if (typeof window === "undefined") return "";

  const paths = key.split("/").filter(Boolean);
  const translationsRoot =
    (window as any).translations ||
    (window as any).localization ||
    (window as any).resources ||
    (window as any).globalTranslations;

  let current: any = translationsRoot;

  for (const segment of paths) {
    if (current && typeof current === "object" && segment in current) {
      current = current[segment];
    } else {
      return "";
    }
  }

  return typeof current === "string" ? current : "";
};

const getLabelValue = (
  labels: ContactFormLabels | undefined,
  key: keyof ContactFormLabels
) => {
  return labels?.[key] ?? localization(`/contactform/${key.toLowerCase()}`);
};

const ContactFormModal = ({
  isOpen,
  onClose,
  schemaId,
  showAttachment,
  formTypeArea,
  teaserText,
  teaserHeading,
  useRecaptcha,
  recaptchaSiteKey,
  labels,
  title,
}: ContactFormModalProps) => {
  const [modalState, setModalState] = useState<ModalState>("form");
  const [errorMessage, setErrorMessage] = useState("");
  const [activeTab, setActiveTab] = useState<number | null>(null);
  const [hideFormTypeSelector, setHideFormTypeSelector] = useState(false);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const isTabMode =
    formTypeArea && formTypeArea.items && formTypeArea.items.length > 0;

  useEffect(() => {
    if (!isOpen || !useRecaptcha || !recaptchaSiteKey) return;
    if (typeof window === "undefined") return;

    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/enterprise.js?render=${recaptchaSiteKey}`;
    script.async = true;
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [isOpen, useRecaptcha, recaptchaSiteKey]);

  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const getFocusable = () => {
      const nodes = Array.from(
        modalRef.current?.querySelectorAll<HTMLElement>(
          'a, button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
        ) || []
      );

      return nodes.filter((el) => {
        if (el.hasAttribute("disabled")) return false;
        if (el.getAttribute("aria-hidden") === "true") return false;
        if ((el as HTMLInputElement).type === "hidden") return false;

        const style = window.getComputedStyle(el);
        if (style.display === "none" || style.visibility === "hidden")
          return false;

        return el.offsetParent !== null || el.getClientRects().length > 0;
      });
    };

    const focusable = getFocusable();
    const target = focusable[0] ?? modalRef.current;
    requestAnimationFrame(() => target.focus());
  }, [isOpen]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const originalOverflow = document.body.style.overflow;

    if (isOpen) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleFormBlockError = (event: Event) => {
      const customEvent = event as CustomEvent<{ hasError?: boolean }>;
      setHideFormTypeSelector(!!customEvent.detail?.hasError);
    };

    const handleFormBlockSuccess = (event: Event) => {
      const customEvent = event as CustomEvent<{ hasSuccess?: boolean }>;
      setHideFormTypeSelector(!!customEvent.detail?.hasSuccess);
    };

    const handleFormBlockClose = () => {
      onClose();
    };

    window.addEventListener("contactformblock:has-error", handleFormBlockError);
    window.addEventListener(
      "contactformblock:has-success",
      handleFormBlockSuccess
    );
    window.addEventListener(
      "contactformblock:close-modal",
      handleFormBlockClose
    );

    return () => {
      window.removeEventListener(
        "contactformblock:has-error",
        handleFormBlockError
      );
      window.removeEventListener(
        "contactformblock:has-success",
        handleFormBlockSuccess
      );
      window.removeEventListener(
        "contactformblock:close-modal",
        handleFormBlockClose
      );
    };
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) {
      setHideFormTypeSelector(false);
    }
  }, [isOpen]);

  useEffect(() => {
    setHideFormTypeSelector(modalState === "error" || modalState === "success");
  }, [modalState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }

      if (e.key === "Tab" && isOpen && modalRef.current) {
        const nodes = Array.from(
          modalRef.current.querySelectorAll<HTMLElement>(
            'a, button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => {
          if (el.hasAttribute("disabled")) return false;
          if (el.getAttribute("aria-hidden") === "true") return false;
          if ((el as HTMLInputElement).type === "hidden") return false;

          const style = window.getComputedStyle(el);
          if (style.display === "none" || style.visibility === "hidden")
            return false;

          return el.offsetParent !== null || el.getClientRects().length > 0;
        });

        const focusable = nodes;

        if (focusable.length === 0) {
          modalRef.current.focus();
          e.preventDefault();
          return;
        }

        const activeEl = document.activeElement as HTMLElement | null;
        const currentIndex = focusable.indexOf(activeEl as HTMLElement);
        const fallbackIndex = 0;

        if (currentIndex === -1) {
          e.preventDefault();
          focusable[fallbackIndex].focus();
          return;
        }

        const nextIndex = e.shiftKey
          ? (currentIndex - 1 + focusable.length) % focusable.length
          : (currentIndex + 1) % focusable.length;

        e.preventDefault();
        focusable[nextIndex].focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleSuccess = () => {
    setModalState("success");
  };

  const handleError = (message?: string) => {
    setErrorMessage(message || getLabelValue(labels, "errorMessage"));
    setModalState("error");
  };

  const handleClose = () => {
    setModalState("form");
    setErrorMessage("");
    onClose();
  };

  const handleRetry = () => {
    setModalState("form");
    setErrorMessage("");
  };

  if (!isOpen) return null;

  const headerTitle =
    title || getLabelValue(labels, "submitButton") || "Contact form";

  return (
    <div className="contact-form-modal" role="presentation">
      <div
        className="contact-form-modal__content"
        role="dialog"
        aria-modal="true"
        aria-label={headerTitle}
        ref={modalRef}
        tabIndex={-1}
      >
        <div className="contact-form-modal__inner">
          <img
            src="/Static/img/a-logo-black.svg"
            alt="Altinn logo"
            className="a-logo a-modal-top-logo"
          />
          <button
            type="button"
            className="contact-form-modal__close"
            onClick={handleClose}
            aria-label={getLabelValue(labels, "closeButton") || "Close"}
          >
            <XMarkIcon
              aria-hidden="true"
              className="contact-form-modal__close-icon"
            />
          </button>
          <div className="modal-header a-modal-header">
            <div>
              <Heading
                as="h1"
                size="lg"
                style={{ display: "flex", alignItems: "center" }}
              >
                <PaperplaneIcon
                  aria-hidden="true"
                  style={{ marginRight: "0.5rem" }}
                />
                {headerTitle}
              </Heading>
            </div>
          </div>
          {isTabMode ? (
            <div className="modal-body a-modal-body">
              {modalState === "form" &&
                !hideFormTypeSelector &&
                formTypeArea &&
                formTypeArea.items &&
                formTypeArea.items.length > 0 && (
                  <Fieldset className="contact-form-modal__formtype">
                    {(teaserText || teaserHeading) && (
                      <Fieldset.Description>
                        {teaserText && <RichTextArea {...teaserText} />}
                        {teaserHeading && (
                          <Heading
                            as="h2"
                            size="lg"
                            style={{ marginTop: "2rem" }}
                          >
                            {teaserHeading}
                          </Heading>
                        )}
                      </Fieldset.Description>
                    )}
                    {formTypeArea.items.map((item, index) => (
                      <Radio
                        key={index}
                        label={(item as any).heading || ""}
                        name={`contact-form-type-${schemaId ?? "default"}`}
                        value={`${index}`}
                        checked={activeTab === index}
                        onChange={() => setActiveTab(index)}
                      />
                    ))}
                  </Fieldset>
                )}

              {modalState === "form" && (
                <div className="tab-content">
                  {activeTab !== null && formTypeArea && (
                    <ContentArea
                      {...formTypeArea}
                      items={[formTypeArea.items[activeTab]]}
                    />
                  )}
                </div>
              )}

              {modalState === "success" && (
                <ContactFormSuccess
                  onClose={handleClose}
                  successMessage={getLabelValue(labels, "successMessage")}
                  closeButtonText={getLabelValue(labels, "closeButton")}
                  autoCloseAfterSeconds={5}
                />
              )}

              {modalState === "error" && (
                <ContactFormError
                  onRetry={handleRetry}
                  onClose={handleClose}
                  errorMessage={
                    errorMessage || getLabelValue(labels, "errorMessage")
                  }
                  closeButtonText={getLabelValue(labels, "closeButton")}
                  retryButtonText={getLabelValue(labels, "retryButton")}
                />
              )}
            </div>
          ) : (
            <div className="modal-body a-modal-body">
              {modalState === "form" && (
                <ContactForm
                  schemaId={schemaId || 0}
                  showAttachment={showAttachment || false}
                  useRecaptcha={useRecaptcha}
                  recaptchaSiteKey={recaptchaSiteKey}
                  isOpen={isOpen}
                  onClose={handleClose}
                  onSuccess={handleSuccess}
                  onError={handleError}
                  labels={labels}
                />
              )}
              {modalState === "success" && (
                <ContactFormSuccess
                  onClose={handleClose}
                  successMessage={getLabelValue(labels, "successMessage")}
                  closeButtonText={getLabelValue(labels, "closeButton")}
                  autoCloseAfterSeconds={5}
                />
              )}
              {modalState === "error" && (
                <ContactFormError
                  onRetry={handleRetry}
                  onClose={handleClose}
                  errorMessage={
                    errorMessage || getLabelValue(labels, "errorMessage")
                  }
                  closeButtonText={getLabelValue(labels, "closeButton")}
                  retryButtonText={getLabelValue(labels, "retryButton")}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactFormModal;
