import {
  Alert,
  Article,
  ArticleHeader,
  Button,
  Divider,
  DsLink,
  Heading,
  Section,
  Typography,
} from "@altinn/altinn-components";
import { ContentArea, OperationalMessage, RichTextArea } from "/App.Components";
import "./SchemaPage.scss";
import {
  BankNoteIcon,
  ClockDashedIcon,
  HourglassIcon,
} from "@navikt/aksel-icons";
import BreadcrumbsView from "../../Layout/Breadcrumbs/BreadcrumbsView";
import MunicipalityCountySearch from "../../Shared/MunicipalityCountySearch/MunicipalityCountySearch";
import ProvidersInline, {
  type ProviderInlineItem,
} from "../../Shared/ProvidersInline/ProvidersInline";
import type {SchemaPageProps} from './SchemaPage.types';
import RichTextMetadata, {
  type RichTextMetadataItem,
} from "../../Shared/RichTextMetadata/RichTextMetadata";

const SchemaPage = ({
  schemaPageNameText,
  schemaCode,
  mainBody,
  operationalMessages,
  startSchemaLink,
  startSchemaLinkText,
  buttonInboxText,
  accordianList,
  providerPages,
  preInstansiated,
  schemaNotInUse,
  deactivateButton,
  deadline,
  deadlineText,
  processTime,
  processTimeText,
  fee,
  feeText,
  securityLevelInfo,
  shallowLink,
  shallowLinkText,
  promoArea,
  breadcrumb,
  areThereMunicipalities,
  areThereCounties,
  apiSourceUrl,
  whatMunicipalityCountyText,
  searchForMunicipalityCountyText,
  noHitText,
  orangeMessage,
  orangeMessageTitle,
}: SchemaPageProps) => {
  const title = schemaPageNameText
    ? schemaCode
      ? `${schemaPageNameText} (${schemaCode})`
      : schemaPageNameText
    : "Skjema";

  const startSchemaLinkButton =
    startSchemaLink &&
    (preInstansiated || (!schemaNotInUse && !deactivateButton)) ? (
      <Button as="a" href={startSchemaLink}>
        {preInstansiated
          ? (buttonInboxText ?? "Åpne")
          : (startSchemaLinkText ?? "Start")}
      </Button>
    ) : null;

  const shallowLinkButton = shallowLink ? (
    <DsLink href={shallowLink}>{shallowLinkText}</DsLink>
  ) : null;

  const owners: ProviderInlineItem[] = (providerPages || [])
    .filter((p: any) => p.providerIcon)
    .map((p: any) => ({
      name: p.providerIcon?.name || "",
      imageUrl: p.providerIcon?.imageUrl || "",
      url: p.url || "#",
      title: p.showAllSchemesLinKText,
    }));

  const metadataItems: RichTextMetadataItem[] = [];
  if (deadline) {
    metadataItems.push({
      icon: ClockDashedIcon,
      label: deadlineText || "",
      content: deadline,
    });
  }
  if (processTime) {
    metadataItems.push({
      icon: HourglassIcon,
      label: processTimeText || "",
      content: processTime,
    });
  }
  if (fee) {
    metadataItems.push({
      icon: BankNoteIcon,
      label: feeText || "",
      content: fee,
    });
  }

  return (
    <Article>
      {breadcrumb && <BreadcrumbsView {...breadcrumb} />}

      {operationalMessages?.filter(Boolean).map((operationalmessage: any, idx: number) => (
        <OperationalMessage
          {...operationalmessage}
          key={operationalmessage.pageName || operationalmessage.message || idx}
        />
      ))}

      <section className="schema-page">
        <ArticleHeader>
          <Heading size="xl" as="h1">
            {title}
          </Heading>
          {owners.length > 0 && <ProvidersInline providers={owners} />}
        </ArticleHeader>

        {orangeMessage && (
          <Section margin="section">
            <Alert variant="warning" heading={orangeMessageTitle ?? ""}>
              <RichTextArea {...orangeMessage} />
            </Alert>
          </Section>
        )}
        {securityLevelInfo && (
          <Typography as="div">
            {securityLevelInfo && <p>{securityLevelInfo}</p>}
          </Typography>
        )}
        {mainBody && <RichTextArea {...mainBody} />}

        {(metadataItems.length > 0 ||
          shallowLinkButton ||
          startSchemaLinkButton) && (
          <Section align="start" spacing={4}>
            {metadataItems.length > 0 && (
              <>
                <Divider />
                <RichTextMetadata items={metadataItems} />
              </>
            )}
            <div className="schema-page__button">
              {shallowLinkButton || startSchemaLinkButton}
            </div>
          </Section>
        )}

        {accordianList && <ContentArea {...accordianList} />}
      </section>
      {(areThereMunicipalities || areThereCounties) &&
        apiSourceUrl &&
        whatMunicipalityCountyText &&
        searchForMunicipalityCountyText &&
        noHitText && (
          <MunicipalityCountySearch
            apiSourceUrl={apiSourceUrl}
            whatText={whatMunicipalityCountyText}
            searchPlaceholder={searchForMunicipalityCountyText}
            noHitText={noHitText}
          />
        )}

      {promoArea && <ContentArea {...promoArea} />}
    </Article>
  );
};

export default SchemaPage;
