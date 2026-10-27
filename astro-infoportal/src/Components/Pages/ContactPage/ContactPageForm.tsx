import {
  Alert,
  Button,
  ErrorSummary,
  Field,
  Fieldset,
  EXPERIMENTAL_FileUpload as FileUpload,
  Input,
  Label,
  Radio,
  Tag,
  Textarea,
  ValidationMessage,
} from "@digdir/designsystemet-react";
import { UploadIcon, XMarkIcon } from "@navikt/aksel-icons";
import type React from "react";
import { useRef, useState } from "react";
import type { ContactPageTexts, ContactPageVariant } from "./ContactPage.types";

type FieldName =
  | "subject"
  | "name"
  | "email"
  | "phone"
  | "message"
  | "attachment";
type TextFieldName = Exclude<FieldName, "attachment">;
type Values = Record<TextFieldName, string>;
type Errors = Partial<Record<FieldName, string>>;

interface ContactPageFormProps {
  variant: ContactPageVariant;
  schemaId: string;
  showAttachment: boolean;
  texts: ContactPageTexts;
  onSent: () => void;
}

const MAX_FILE_SIZE = 15 * 1024 * 1024;
const ALLOWED_EXTENSIONS = [
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
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizePhone = (phone: string) =>
  phone.replace(/[\s-]/g, "").replace(/^(\+47|0047)/, "");

const fieldIds: Record<FieldName, string> = {
  subject: "contact-subject",
  name: "contact-name",
  email: "contact-email",
  phone: "contact-phone",
  message: "contact-message",
  attachment: "contact-attachment",
};

const formatFileSize = (bytes: number) => {
  const sizes = ["B", "KB", "MB", "GB"];
  const i = bytes === 0 ? 0 : Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
};

const ContactPageForm = ({
  variant,
  schemaId,
  showAttachment,
  texts,
  onSent,
}: ContactPageFormProps) => {
  const [values, setValues] = useState<Values>({
    subject: "",
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [location, setLocation] = useState("");
  const [attachment, setAttachment] = useState<File>();
  const [errors, setErrors] = useState<Errors>({});
  const [summaryKey, setSummaryKey] = useState(0);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sendError, setSendError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const useSubjectOptions = texts.subjectOptions.length > 0;
  const fieldOrder: FieldName[] =
    variant === "altinn"
      ? ["subject", "name", "email", "phone", "message", "attachment"]
      : ["name", "email", "phone", "subject", "message", "attachment"];

  const validate = (next: Values): Errors => {
    const result: Errors = {};
    if (!next.subject.trim()) result.subject = texts.subjectRequired;
    if (!next.name.trim()) result.name = texts.nameRequired;
    if (!next.email.trim()) result.email = texts.emailRequired;
    else if (!EMAIL_REGEX.test(next.email.trim()))
      result.email = texts.emailInvalid;
    if (next.phone.trim() && !/^[0-9]{8}$/.test(normalizePhone(next.phone))) {
      result.phone = texts.phoneInvalid;
    }
    if (!next.message.trim()) result.message = texts.messageRequired;
    return result;
  };

  const updateValue = (field: TextFieldName, value: string) => {
    const next = { ...values, [field]: value };
    setValues(next);
    if (errors[field] && !validate(next)[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateFormat = (field: "email" | "phone") => {
    if (!values[field].trim()) return;
    setErrors((prev) => ({ ...prev, [field]: validate(values)[field] }));
  };

  const validateFile = (file: File) => {
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (file.size > MAX_FILE_SIZE) return texts.attachmentSizeError;
    if (!ALLOWED_EXTENSIONS.includes(extension))
      return texts.attachmentExtensionError;
    return undefined;
  };

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const error = file ? validateFile(file) : undefined;
    setAttachment(file && !error ? file : undefined);
    setErrors((prev) => ({ ...prev, attachment: error }));
    if (error) e.target.value = "";
  };

  const removeAttachment = () => {
    setAttachment(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.focus();
    }
  };

  const focusField = (field: FieldName) => (e: React.MouseEvent) => {
    e.preventDefault();
    const target =
      field === "subject" && useSubjectOptions
        ? `${fieldIds.subject}-0`
        : fieldIds[field];
    document.getElementById(target)?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const nextErrors = { ...validate(values), attachment: errors.attachment };
    setErrors(nextErrors);
    setHasSubmitted(true);
    setSendError(false);

    if (fieldOrder.some((field) => nextErrors[field])) {
      setSummaryKey((key) => key + 1);
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("name", values.name.trim());
      formData.append("email", values.email.trim());
      formData.append("phone", normalizePhone(values.phone));
      formData.append("subject", values.subject.trim());
      formData.append("message", values.message);
      formData.append("location", location);
      formData.append("schemaId", schemaId);
      formData.append("language", document.documentElement.lang || "nb");
      if (attachment) formData.append("attachment", attachment);

      const csrfToken =
        document.querySelector<HTMLInputElement>(
          'input[name="__RequestVerificationToken"]',
        )?.value || "";

      const response = await fetch("/api/contactform/send", {
        method: "POST",
        body: formData,
        headers: { RequestVerificationToken: csrfToken },
      });
      const result: { success?: boolean } = await response.json();

      if (result.success) onSent();
      else setSendError(true);
    } catch {
      setSendError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const labelWithTag = (label: string, required: boolean) => (
    <>
      {label}
      <Tag
        className="contact-page-form__tag"
        data-color={required ? "warning" : "info"}
        data-size="sm"
      >
        {required ? texts.required : texts.optional}
      </Tag>
    </>
  );

  const summaryErrors = fieldOrder.filter((field) => errors[field]);

  const subjectField = useSubjectOptions ? (
    <Fieldset key="subject">
      <Fieldset.Legend>{labelWithTag(texts.subject, true)}</Fieldset.Legend>
      {texts.subjectOptions.map((option, index) => (
        <Radio
          key={option}
          id={`${fieldIds.subject}-${index}`}
          label={option}
          name="subject"
          value={option}
          checked={values.subject === option}
          onChange={() => updateValue("subject", option)}
        />
      ))}
      {errors.subject && (
        <ValidationMessage>{errors.subject}</ValidationMessage>
      )}
    </Fieldset>
  ) : (
    <Field key="subject">
      <Label htmlFor={fieldIds.subject}>
        {labelWithTag(texts.subject, true)}
      </Label>
      <Input
        id={fieldIds.subject}
        value={values.subject}
        onChange={(e) => updateValue("subject", e.target.value)}
      />
      {errors.subject && (
        <ValidationMessage>{errors.subject}</ValidationMessage>
      )}
    </Field>
  );

  const fields: Record<FieldName, React.ReactNode> = {
    subject: subjectField,
    name: (
      <Field key="name">
        <Label htmlFor={fieldIds.name}>{labelWithTag(texts.name, true)}</Label>
        <Input
          id={fieldIds.name}
          autoComplete="name"
          value={values.name}
          onChange={(e) => updateValue("name", e.target.value)}
        />
        {errors.name && <ValidationMessage>{errors.name}</ValidationMessage>}
      </Field>
    ),
    email: (
      <Field key="email">
        <Label htmlFor={fieldIds.email}>
          {labelWithTag(texts.email, true)}
        </Label>
        <Input
          id={fieldIds.email}
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={(e) => updateValue("email", e.target.value)}
          onBlur={() => validateFormat("email")}
        />
        {errors.email && <ValidationMessage>{errors.email}</ValidationMessage>}
      </Field>
    ),
    phone: (
      <Field key="phone">
        <Label htmlFor={fieldIds.phone}>
          {labelWithTag(texts.phoneLabel, false)}
        </Label>
        <Input
          id={fieldIds.phone}
          type="tel"
          autoComplete="tel"
          value={values.phone}
          onChange={(e) => updateValue("phone", e.target.value)}
          onBlur={() => validateFormat("phone")}
        />
        {errors.phone && <ValidationMessage>{errors.phone}</ValidationMessage>}
      </Field>
    ),
    message: (
      <Field key="message">
        <Label htmlFor={fieldIds.message}>
          {labelWithTag(texts.message, true)}
        </Label>
        <Field.Description>{texts.messageDescription}</Field.Description>
        <Textarea
          id={fieldIds.message}
          rows={8}
          value={values.message}
          onChange={(e) => updateValue("message", e.target.value)}
          suppressHydrationWarning
        />
        {errors.message && (
          <ValidationMessage>{errors.message}</ValidationMessage>
        )}
      </Field>
    ),
    attachment: showAttachment && (
      <Field key="attachment">
        <Label htmlFor={fieldIds.attachment}>
          {labelWithTag(texts.attachment, false)}
        </Label>
        <Field.Description>{texts.attachmentDescription}</Field.Description>
        <FileUpload className="contact-page-form__file-upload">
          <Button asChild variant="secondary">
            <span>
              <UploadIcon aria-hidden />
              {texts.attachmentButton}
            </span>
          </Button>
          <input
            ref={fileInputRef}
            id={fieldIds.attachment}
            type="file"
            accept={ALLOWED_EXTENSIONS.map((ext) => `.${ext}`).join(",")}
            onChange={handleAttachmentChange}
          />
        </FileUpload>
        <div aria-live="polite">
          {attachment && (
            <div className="contact-page-form__file">
              <span>
                {attachment.name} ({formatFileSize(attachment.size)})
              </span>
              <Button
                variant="tertiary"
                data-size="sm"
                onClick={removeAttachment}
                aria-label={`${texts.attachmentDelete} ${attachment.name}`}
              >
                <XMarkIcon aria-hidden />
                {texts.attachmentDelete}
              </Button>
            </div>
          )}
          {errors.attachment && (
            <ValidationMessage>{errors.attachment}</ValidationMessage>
          )}
        </div>
      </Field>
    ),
  };

  return (
    <form className="contact-page-form" onSubmit={handleSubmit} noValidate>
      {fieldOrder.map((field) => fields[field])}

      <input
        type="text"
        name="location"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        className="contact-page-form__honeypot"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
      />

      {hasSubmitted && summaryErrors.length > 0 && (
        <ErrorSummary key={summaryKey}>
          <ErrorSummary.Heading>
            {texts.errorSummaryHeading}
          </ErrorSummary.Heading>
          <ErrorSummary.List>
            {summaryErrors.map((field) => (
              <ErrorSummary.Item key={field}>
                <ErrorSummary.Link
                  href={`#${fieldIds[field]}`}
                  onClick={focusField(field)}
                >
                  {errors[field]}
                </ErrorSummary.Link>
              </ErrorSummary.Item>
            ))}
          </ErrorSummary.List>
        </ErrorSummary>
      )}

      <div>
        <div aria-live="polite" className="contact-page-form__alert">
          {sendError && <Alert data-color="danger">{texts.sendError}</Alert>}
        </div>
        <Button type="submit" aria-busy={isSubmitting || undefined}>
          {isSubmitting ? texts.submitting : texts.submit}
        </Button>
      </div>
    </form>
  );
};

export default ContactPageForm;
