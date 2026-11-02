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

const TextWithPhone = ({ text, phone }: { text: string; phone: string }) => {
  const [before, after] = text.split("{0}");
  return (
    <>
      {before}
      <Link href={`tel:${phone.replace(/\s/g, "")}`}>{phone}</Link>
      {after}
    </>
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
          <Paragraph>
            <TextWithPhone text={texts.successText} phone={texts.phone} />
          </Paragraph>
        </Alert>
      ) : (
        <>
          <Heading as="h1" size="xl">
            {texts.heading}
          </Heading>
          {texts.alertHeading && (
            <Alert data-color="warning">
              <DsHeading level={2} data-size="xs">
                {texts.alertHeading}
              </DsHeading>
              <Paragraph>{texts.alertText}</Paragraph>
              <Paragraph>
                <strong>
                  <TextWithPhone text={texts.alertPhone} phone={texts.phone} />
                </strong>
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
