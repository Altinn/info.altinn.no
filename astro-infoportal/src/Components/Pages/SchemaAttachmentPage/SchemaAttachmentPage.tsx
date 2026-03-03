import {
  Alert,
  Article,
  ArticleHeader,
  Badge,
  Divider,
  Heading,
  List,
  Section,
  Typography,
} from "@altinn/altinn-components";
import { ContentArea, OperationalMessage, RichTextArea } from "/App.Components";
import { SchemaAttachmentPageViewModel } from "/Models/Generated/SchemaAttachmentPageViewModel";
import BreadcrumbsView from "../../Layout/Breadcrumbs/BreadcrumbsView";
import ProvidersInline, {
  ProviderInlineItem,
} from "../../Shared/ProvidersInline/ProvidersInline";
import { SearchItem } from "/Components/Shared/SearchItem/SearchItem";

const SchemaAttachmentPage = ({
  pageName,
  schemaCode,
  attachmentBadgeText,
  ownerProviders,
  mainIntro,
  orangeMessage,
  orangeMessageTitle,
  accordianList,
  whereToFindSchemaText,
  relatedSchemas,
  promoArea,
  breadcrumb,
  criticalMessages,
  missingTranslation,
  missingTranslationText,
}: SchemaAttachmentPageViewModel) => {
  const title = schemaCode
    ? `${pageName || ""} (${schemaCode})`
    : pageName || "";

  const owners: ProviderInlineItem[] = (ownerProviders || [])
    .filter(
      (p): p is typeof p & { name: string } =>
        p?.name != null && p.name !== "",
    )
    .map((p) => ({
      name: p.name,
      imageUrl: p.imageUrl || "",
      url: p.url || undefined,
    }));

  return (
    <Article>
      {breadcrumb && <BreadcrumbsView {...breadcrumb} />}

      {criticalMessages?.filter(Boolean).map((msg, idx) => (
        <OperationalMessage {...msg} key={idx} />
      ))}

      {missingTranslation && missingTranslationText && (
        <Alert variant="info" heading={""} message={missingTranslationText || ""} />
      )}

      <ArticleHeader>
        <Heading size="xl" as="h1">
          {title}
          {attachmentBadgeText && (
            <span style={{ display: "inline-flex", alignItems: "center", verticalAlign: "middle", marginLeft: "0.25em" }}><Badge label={attachmentBadgeText} size="sm" color="alert" variant="base" /></span>
          )}
        </Heading>
        {owners.length > 0 && (
          <ProvidersInline providers={owners} />
        )}
      </ArticleHeader>

      {mainIntro && (
        <Typography>
          <RichTextArea {...mainIntro} />
        </Typography>
      )}

      {orangeMessage && (
        <Section margin="section">
          <Alert variant="warning" heading={orangeMessageTitle ?? ""}>
            <RichTextArea {...orangeMessage} />
          </Alert>
        </Section>
      )}

      {relatedSchemas && relatedSchemas.length > 0 && (
        <Section>
          {whereToFindSchemaText && (
            <Typography as="p">
              {whereToFindSchemaText}:
            </Typography>
          )}
          <List size="sm" color="neutral" spacing={0}>
            {relatedSchemas.map(({ providers, title, url, id }, idx) => {
              const providerItems: ProviderInlineItem[] = (providers || [])
                .filter(
                  (p): p is typeof p & { name: string } =>
                    p?.name != null && p.name !== "",
                )
                .map((p) => ({
                  name: p.name,
                  imageUrl: p.imageUrl || "",
                  url: (p as any).url || undefined,
                }));

              return (
                <>
                  <SearchItem
                    className="search-item__item"
                    key={id ?? idx}
                    as="a"
                    href={url}
                    title={title}
                    summary={
                      providerItems.length ? (
                        <ProvidersInline
                          providers={providerItems}
                          disableLinks={true}
                        />
                      ) : undefined
                    }
                  />
                  <Divider as="li" key={`div-${id ?? idx}`} />
                </>
              );
            })}
          </List>
        </Section>
      )}

      {accordianList && (
        <ContentArea {...accordianList} />
      )}

      {promoArea && <ContentArea {...promoArea} />}
    </Article>
  );
};

export default SchemaAttachmentPage;
