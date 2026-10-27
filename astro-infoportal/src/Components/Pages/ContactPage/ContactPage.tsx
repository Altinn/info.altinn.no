import { Article, Heading } from "@altinn/altinn-components";
import {
  Alert,
  Heading as DsHeading,
  Link,
  Paragraph,
} from "@digdir/designsystemet-react";
import { useEffect, useRef, useState } from "react";
import BreadcrumbsView from "../../Layout/Breadcrumbs/BreadcrumbsView";
import type { ContactPageProps } from "./ContactPage.types";
import ContactPageForm from "./ContactPageForm";
import "./ContactPage.scss";

const SuccessText = ({ text, phone }: { text: string; phone: string }) => {
  const [before, after] = text.split("{0}");
  return (
    <Paragraph>
      {before}
      <Link href={`tel:${phone.replace(/\s/g, "")}`}>{phone}</Link>
      {after}
    </Paragraph>
  );
};

const ContactPage = ({
  variant,
  schemaId,
  showAttachment,
  breadcrumb,
  texts,
}: ContactPageProps) => {
  const [isSent, setIsSent] = useState(false);
  const successRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isSent) successRef.current?.focus();
  }, [isSent]);

  return (
    <Article>
      {breadcrumb && <BreadcrumbsView {...breadcrumb} />}
      {isSent ? (
        <Alert
          ref={successRef}
          tabIndex={-1}
          data-color="success"
          className="contact-page__success"
        >
          <DsHeading level={1} data-size="xs">
            {texts.successHeading}
          </DsHeading>
          <SuccessText text={texts.successText} phone={texts.phone} />
        </Alert>
      ) : (
        <>
          <Heading as="h1" size="lg">
            {texts.heading}
          </Heading>
          {texts.alertHeading && (
            <Alert data-color="warning">
              <DsHeading level={2} data-size="xs">
                {texts.alertHeading}
              </DsHeading>
              <Paragraph>{texts.alertText}</Paragraph>
              <Paragraph>
                <strong>{texts.alertPhone}</strong>
              </Paragraph>
            </Alert>
          )}
          <ContactPageForm
            variant={variant}
            schemaId={schemaId}
            showAttachment={showAttachment}
            texts={texts}
            onSent={() => setIsSent(true)}
          />
        </>
      )}
    </Article>
  );
};

export default ContactPage;
