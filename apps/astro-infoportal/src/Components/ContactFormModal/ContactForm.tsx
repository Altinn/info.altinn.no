import {
  Button,
  Field,
  Input,
  Label,
  Textarea,
  ValidationMessage,
} from "@digdir/designsystemet-react";
import { UploadIcon, XMarkIcon } from "@navikt/aksel-icons";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
  ContactFormApiResponse,
  ContactFormErrors,
  ContactFormLabels,
  ContactFormModalProps,
} from "./ContactFormTypes";

declare global {
  interface Window {
    grecaptcha?: {
      enterprise?: {
        execute?: (
          siteKey: string,
          options: { action: string }
        ) => Promise<string>;
      };
    };
  }
}

interface ContactFormProps extends ContactFormModalProps {
  onSuccess: () => void;
  onError: (message: string) => void;
}

const fallbackLocalization = (key: string): string => {
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
  labels: any | undefined,
  key: keyof ContactFormLabels
) => {
  return (
    labels?.[key] ?? fallbackLocalization(`/contactform/${key.toLowerCase()}`)
  );
};

const getCurrentLanguage = (): string => {
  if (typeof document === "undefined") return "nb";
  return document.documentElement.lang || "nb";
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** i).toFixed(2)} ${sizes[i]}`;
};

const ContactForm = ({
  schemaId,
  showAttachment,
  useRecaptcha,
  recaptchaSiteKey,
  onSuccess,
  onError,
  labels,
}: ContactFormProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [location, setLocation] = useState(""); // honeypot
  const [attachment, setAttachment] = useState<File | undefined>(undefined);
  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const emailRegex = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/, []);

  // Re-validate confirm email when email field changes
  useEffect(() => {
    // Only validate if user has entered something in confirmEmail
    if (confirmEmail) {
      if (confirmEmail !== email) {
        setErrors((prev) => ({
          ...prev,
          confirmEmail: getLabelValue(labels, "confirmEmailValidation"),
        }));
      } else if (confirmEmail === email) {
        setErrors((prev) => ({ ...prev, confirmEmail: undefined }));
      }
    }
  }, [email, confirmEmail, labels]);

  // Re-validate message when message field changes
  useEffect(() => {
    // Only validate if user has entered something in message
    if (message) {
      if (message.trim().length < 1) {
        setErrors((prev) => ({
          ...prev,
          message: getLabelValue(labels, "messagePlaceholder"),
        }));
      } else if (message.trim().length >= 1) {
        setErrors((prev) => ({ ...prev, message: undefined }));
      }
    }
  }, [message, labels]);

  const validateName = () => {
    if (!name || name.trim().length < 2) {
      setErrors((prev) => ({
        ...prev,
        name: getLabelValue(labels, "nameValidation") || "Name is required",
      }));
      return false;
    }
    setErrors((prev) => ({ ...prev, name: undefined }));
    return true;
  };

  const validateEmail = () => {
    if (!email || !emailRegex.test(email)) {
      setErrors((prev) => ({
        ...prev,
        email: getLabelValue(labels, "emailValidation") || "Invalid email",
      }));
      return false;
    }
    setErrors((prev) => ({ ...prev, email: undefined }));
    return true;
  };

  const validateConfirmEmail = () => {
    if (confirmEmail !== email) {
      setErrors((prev) => ({
        ...prev,
        confirmEmail: getLabelValue(labels, "confirmEmailValidation"),
      }));
      return false;
    }
    setErrors((prev) => ({ ...prev, confirmEmail: undefined }));
    return true;
  };

  const validatePhone = () => {
    if (phone && !/^[0-9]{8}$/.test(phone)) {
      setErrors((prev) => ({
        ...prev,
        phone:
          getLabelValue(labels, "phoneValidation") || "Phone must be 8 digits",
      }));
      return false;
    }
    setErrors((prev) => ({ ...prev, phone: undefined }));
    return true;
  };

  const validateSubject = () => {
    if (!subject || subject.trim().length < 3) {
      setErrors((prev) => ({
        ...prev,
        subject:
          getLabelValue(labels, "topicPlaceholder") || "Subject is required",
      }));
      return false;
    }
    setErrors((prev) => ({ ...prev, subject: undefined }));
    return true;
  };

  const validateMessage = () => {
    if (!message || message.trim().length < 1) {
      setErrors((prev) => ({
        ...prev,
        message:
          getLabelValue(labels, "messagePlaceholder") || "Message is required",
      }));
      return false;
    }
    setErrors((prev) => ({ ...prev, message: undefined }));
    return true;
  };

  const validateFile = (file: File): boolean => {
    const maxSize = 15 * 1024 * 1024; // 15MB
    const allowedExtensions = [
      "bmp",
      "jpg",
      "jpeg",
      "png",
      "gif",
      "txt",
      "log",
      "csv",
      "doc",
      "docx",
      "xls",
      "xlsx",
      "ppt",
      "pptx",
      "pdf",
      "odt",
      "ods",
      "odp",
      "rtf",
      "rar",
      "zip",
      "7z",
      "gdoc",
      "gsheet",
      "gslide",
      "htm",
      "html",
      "eml",
      "msg",
    ];

    if (file.size > maxSize) {
      setErrors((prev) => ({
        ...prev,
        attachment: getLabelValue(labels, "attachmentSizeError"),
      }));
      return false;
    }

    const extension = file.name.split(".").pop()?.toLowerCase();

    if (!extension || !allowedExtensions.includes(extension)) {
      setErrors((prev) => ({
        ...prev,
        attachment: getLabelValue(labels, "attachmentExtensionError"),
      }));
      return false;
    }

    setErrors((prev) => ({ ...prev, attachment: undefined }));
    return true;
  };

  const validateAllFields = () => {
    const result =
      validateName() &&
      validateEmail() &&
      validateConfirmEmail() &&
      validatePhone() &&
      validateSubject() &&
      validateMessage() &&
      location === "";

    if (attachment && !validateFile(attachment)) {
      return false;
    }

    return result;
  };

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (validateFile(file)) {
        setAttachment(file);
      } else {
        setAttachment(undefined);
      }
    } else {
      setAttachment(undefined);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateAllFields()) {
      return;
    }

    setIsSubmitting(true);
    setErrors((prev) => ({ ...prev, general: undefined }));

    try {
      let recaptchaToken = "";

      if (useRecaptcha && recaptchaSiteKey && typeof window !== "undefined") {
        if (window.grecaptcha?.enterprise?.execute) {
          recaptchaToken = await window.grecaptcha.enterprise.execute(
            recaptchaSiteKey,
            {
              action: "contact_form",
            }
          );
        }
      }

      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("phone", phone || "");
      formData.append("subject", subject);
      formData.append("message", message);
      formData.append("location", location);
      formData.append("schemaId", schemaId?.toString() || "");
      formData.append("language", getCurrentLanguage());

      if (recaptchaToken) {
        formData.append("recaptchaToken", recaptchaToken);
      }

      if (attachment) {
        formData.append("attachment", attachment);
      }

      const csrfToken =
        document.querySelector<HTMLInputElement>(
          'input[name="__RequestVerificationToken"]'
        )?.value || "";

      const response = await fetch("/api/contactform/send", {
        method: "POST",
        body: formData,
        headers: {
          RequestVerificationToken: csrfToken,
        },
      });

      const result: ContactFormApiResponse = await response.json();

      if (result.success) {
        onSuccess();
      } else {
        onError(result.errorMessage || getLabelValue(labels, "errorMessage"));
      }
    } catch (_err) {
      onError(
        getLabelValue(labels, "errorMessage") || "An unexpected error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="contact-form" onSubmit={handleSubmit} noValidate>
      <div className="contact-form__fields">
        {errors.general && (
          <div className="contact-form__error-message" role="alert">
            {errors.general}
          </div>
        )}

        <Field className="contact-form__field">
          <Label htmlFor="contact-name">
            {getLabelValue(labels, "nameLabel") || ""}
          </Label>
          <Input
            id="contact-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={validateName}
            placeholder={getLabelValue(labels, "namePlaceholder") || ""}
            autoComplete="name"
            disabled={isSubmitting}
            aria-required
          />
          {errors.name && <ValidationMessage>{errors.name}</ValidationMessage>}
        </Field>

        <Field className="contact-form__field">
          <Label htmlFor="contact-email">
            {getLabelValue(labels, "emailLabel") || ""}
          </Label>
          <Input
            id="contact-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={validateEmail}
            placeholder={getLabelValue(labels, "emailPlaceholder") || ""}
            autoComplete="email"
            disabled={isSubmitting}
            aria-required
          />
          {errors.email && (
            <ValidationMessage>{errors.email}</ValidationMessage>
          )}
        </Field>

        <Field className="contact-form__field">
          <Label htmlFor="contact-confirm-email">
            {getLabelValue(labels, "confirmEmailLabel") || ""}
          </Label>
          <Input
            id="contact-confirm-email"
            type="email"
            value={confirmEmail}
            onChange={(e) => setConfirmEmail(e.target.value)}
            onBlur={validateConfirmEmail}
            placeholder={getLabelValue(labels, "confirmEmailPlaceholder") || ""}
            autoComplete="email"
            disabled={isSubmitting}
            aria-required
          />
          {errors.confirmEmail && (
            <ValidationMessage>{errors.confirmEmail}</ValidationMessage>
          )}
        </Field>

        <Field className="contact-form__field">
          <Label htmlFor="contact-phone">
            {getLabelValue(labels, "phoneLabel") || ""}
          </Label>
          <Input
            id="contact-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onBlur={validatePhone}
            placeholder={getLabelValue(labels, "phonePlaceholder") || ""}
            autoComplete="tel"
            disabled={isSubmitting}
          />
          {errors.phone && (
            <ValidationMessage>{errors.phone}</ValidationMessage>
          )}
        </Field>

        <Field className="contact-form__field">
          <Label htmlFor="contact-subject">
            {getLabelValue(labels, "topicLabel") || ""}
          </Label>
          <Input
            id="contact-subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            onBlur={validateSubject}
            placeholder={getLabelValue(labels, "topicPlaceholder") || ""}
            disabled={isSubmitting}
            aria-required
          />
          {errors.subject && (
            <ValidationMessage>{errors.subject}</ValidationMessage>
          )}
        </Field>

        <Field className="contact-form__field">
          <Label htmlFor="contact-message">
            {getLabelValue(labels, "messageLabel") || ""}
          </Label>
          <div
            id="contact-message-description"
            className="contact-form__message-description"
          >
            {getLabelValue(labels, "messageDescription") || ""}
          </div>
          <Textarea
            id="contact-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onBlur={validateMessage}
            placeholder={getLabelValue(labels, "messagePlaceholder") || ""}
            disabled={isSubmitting}
            aria-required
            aria-describedby="contact-message-description"
          />
          {errors.message && (
            <ValidationMessage>{errors.message}</ValidationMessage>
          )}
        </Field>

        {showAttachment && (
          <Field className="contact-form__field">
            <Label htmlFor="contact-attachment">
              {getLabelValue(labels, "attachmentLabel") || ""}
            </Label>
            <div className="contact-form__file">
              <input
                ref={fileInputRef}
                id="contact-attachment"
                type="file"
                onChange={handleAttachmentChange}
                disabled={isSubmitting}
              />
              {!attachment && (
                <Button
                  variant="secondary"
                  className="contact-form__file-button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting}
                >
                  <UploadIcon aria-hidden />
                  {getLabelValue(labels, "attachmentButton") || ""}
                </Button>
              )}
              {attachment && (
                <div className="contact-form__file-preview">
                  <div className="contact-form__file-info">
                    <span className="contact-form__file-name">
                      {attachment.name}
                    </span>
                    <span className="contact-form__file-size">
                      {formatFileSize(attachment.size)}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="tertiary"
                    className="contact-form__file-delete"
                    onClick={() => {
                      setAttachment(undefined);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                    disabled={isSubmitting}
                  >
                    <span
                      className="contact-form__file-delete-icon"
                      aria-hidden="true"
                    >
                      <XMarkIcon />
                    </span>
                    <span className="contact-form__file-delete-text">
                      {getLabelValue(labels, "attachmentDelete") || ""}
                    </span>
                  </Button>
                </div>
              )}
            </div>
            {errors.attachment && (
              <ValidationMessage>{errors.attachment}</ValidationMessage>
            )}
          </Field>
        )}

        <input
          type="text"
          name="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          style={{ display: "none" }}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="contact-form__actions">
        <Button
          type="submit"
          className="contact-form__submit"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? getLabelValue(labels, "submitting") || "Sender..."
            : getLabelValue(labels, "submitButton") || "Send"}
        </Button>
      </div>
    </form>
  );
};

export default ContactForm;
