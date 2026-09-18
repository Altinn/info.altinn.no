import {
  Article,
  ArticleHeader,
  Grid,
  Heading,
  ListItem,
  Typography,
} from "@altinn/altinn-components";
import { Card, Details } from "@digdir/designsystemet-react";
import * as AkselIcons from "@navikt/aksel-icons";
import ContentArea from "../../Shared/ContentArea/ContentArea";
import RichTextArea from "../../Shared/RichTextArea/RichTextArea";
import SearchInput from "../../Shared/SearchInput/SearchInput";
import { UiText } from "../../Shared/UiLanguage/UiLanguage";
import "./HelpStartPage.scss";

// `heading` is the editor's own, in the language of the content; `translated`
// is the interface fallback and needs its own language when the page fell back
// to bokmål content in a non-bokmål interface (issue #713).
const SectionHeading = ({
  heading,
  translated,
  className,
}: {
  heading?: string;
  translated?: string;
  className?: string;
}) => {
  if (!heading && !translated) return null;
  return (
    <Heading className={className} as="h2" size="md">
      {heading ?? <UiText>{translated}</UiText>}
    </Heading>
  );
};

// ListItem renders the card as an <a> and defaults its aria-label to `title`,
// which would hide the description from screen readers. Announce both so the
// link name matches what is rendered.
const drilldownAriaLabel = (page: any) =>
  page.description ? `${page.pageName}. ${page.description}` : page.pageName;

const getIcon = (iconName?: string) => {
  if (!iconName) return undefined;
  const IconComponent = (AkselIcons as any)[iconName];
  return IconComponent || undefined;
};

// The design puts the description on its own full-width row below the icon+title
// row, rather than indented beside the icon. ListItem's own `title`/`description`
// slots share one flex column next to the icon, so the card content is composed
// through the public `label` slot (which replaces that column) and the icon is
// rendered inline instead of via the `icon` prop.
const DrilldownCard = ({ page, id }: { page: any; id: string }) => {
  const IconComponent = getIcon(page.akselIcon);

  return (
    <ListItem
      className="help-start-page__drilldown-item"
      id={id}
      as="a"
      href={page.url || "#"}
      variant="subtle"
      ariaLabel={drilldownAriaLabel(page)}
      label={
        <span className="help-start-page__drilldown-card">
          <span className="help-start-page__drilldown-card-head">
            {IconComponent && (
              <IconComponent
                className="help-start-page__drilldown-card-icon"
                aria-hidden
              />
            )}
            <h3 className="help-start-page__drilldown-card-title">
              {page.pageName}
            </h3>
          </span>
          {page.description && (
            <span className="help-start-page__drilldown-card-description">
              {page.description}
            </span>
          )}
        </span>
      }
    />
  );
};

const HelpStartPage = ({
  pageName,
  mainIntro,
  newDrilldownPages,
  oldDrilldownPages,
  questionAreaHeading,
  translatedQuestionAreaHeading,
  questionArea,
  helpContentArea,
  currentVersionHeading,
  translatedCurrentVersionHeading,
  newVersionHeading,
  translatedNewVersionHeading,
  searchHeading,
  translatedSearchHeading,
  searchPlaceholder,
  searchAriaLabel,
  helpSearchPageUrl,
  helpContentAreaHeading,
  translatedHelpContentAreaHeading,
  // breadcrumb,
}: any) => {
  return (
    <Article>
      {/* {breadcrumb && <BreadcrumbsView {...breadcrumb} />} */}
      <ArticleHeader className="help-start-page__header">
        <Heading className="help-start-page__header-title" size="xl" as="h1">
          {pageName}
        </Heading>
        {mainIntro && <Typography as="div">{mainIntro}</Typography>}
      </ArticleHeader>

      {newDrilldownPages && newDrilldownPages.length > 0 && (
        <div className="help-start-page__drilldown-section">
          <SectionHeading
            heading={newVersionHeading}
            translated={translatedNewVersionHeading}
          />
          <Grid
            as="ul"
            className="help-start-page__drilldown-grid"
            color="company"
            spacing={3}
            cols={2}
          >
            {newDrilldownPages.map((page: any, idx: number) => (
              <DrilldownCard key={idx} id={idx.toString()} page={page} />
            ))}
          </Grid>
        </div>
      )}

      {oldDrilldownPages && oldDrilldownPages.length > 0 && (
        <div className="help-start-page__drilldown-section">
          <SectionHeading
            heading={currentVersionHeading}
            translated={translatedCurrentVersionHeading}
          />
          <Grid
            as="ul"
            className="help-start-page__drilldown-grid"
            color="company"
            spacing={3}
            cols={2}
          >
            {oldDrilldownPages.map((page: any, idx: number) => (
              <DrilldownCard key={idx} id={idx.toString()} page={page} />
            ))}
          </Grid>
        </div>
      )}

      <div className="help-start-page__question-section">
        <SectionHeading
          heading={questionAreaHeading}
          translated={translatedQuestionAreaHeading}
        />

        {questionArea && questionArea.length > 0 && (
          <Card data-color="neutral">
            {questionArea.map((page: any, idx: number) => (
              <Details
                key={idx}
                variant="default"
                data-color="neutral"
                data-size="md"
              >
                <Details.Summary role="button" tabIndex={0} slot="summary">
                  {page.pageName}
                </Details.Summary>
                <Details.Content>
                  {page.body && <RichTextArea {...page.body} />}
                </Details.Content>
              </Details>
            ))}
          </Card>
        )}
      </div>
      <div className="help-start-page__search-section">
        <SectionHeading
          heading={searchHeading}
          translated={translatedSearchHeading}
        />
        {helpSearchPageUrl && (
          <SearchInput
            placeholder={searchPlaceholder || ""}
            searchPageUrl={helpSearchPageUrl}
            ariaLabel={searchAriaLabel}
          />
        )}
      </div>

      {helpContentArea && (
        <>
          <SectionHeading
            className="help-start-page__help-content-area-heading"
            heading={helpContentAreaHeading}
            translated={translatedHelpContentAreaHeading}
          />
          <ContentArea {...helpContentArea} />
        </>
      )}
    </Article>
  );
};

export default HelpStartPage;
