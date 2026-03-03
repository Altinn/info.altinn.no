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
import { HelpStartPageViewModel } from "/Models/Generated/HelpStartPageViewModel";
import ContentArea from "../../Shared/ContentArea/ContentArea";
import RichTextArea from "../../Shared/RichTextArea/RichTextArea";
import SearchInput from "../../Shared/SearchInput/SearchInput";
import "./HelpStartPage.scss";

const HelpStartPage = ({
  pageName,
  mainIntro,
  newDrilldownPages,
  oldDrilldownPages,
  questionAreaHeading,
  questionArea,
  helpContentArea,
  currentVersionHeading,
  newVersionHeading,
  searchPlaceholder,
  searchAriaLabel,
  helpSearchPageUrl,
  helpContentAreaHeading,
  // breadcrumb,
}: HelpStartPageViewModel) => {
  const getIcon = (iconName?: string) => {
    if (!iconName) return undefined;
    const IconComponent = (AkselIcons as any)[iconName];
    return IconComponent || undefined;
  };

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
          {newVersionHeading && (
            <Heading as="h2" size="md">
              {newVersionHeading}
            </Heading>
          )}
          <Grid color="company" spacing={3} cols={2}>
            {newDrilldownPages.map((page, idx) => {
              const iconName = (page as any).akselIcon;
              const IconComponent = getIcon(iconName);

              return (
                <ListItem
                  id={idx.toString()}
                  as="a"
                  href={page.url || "#"}
                  size="lg"
                  key={idx}
                  title={page.pageName}
                  variant="subtle"
                  icon={IconComponent}
                />
              );
            })}
          </Grid>
        </div>
      )}

      {oldDrilldownPages && oldDrilldownPages.length > 0 && (
        <div className="help-start-page__drilldown-section">
          {currentVersionHeading && (
            <Heading as="h2" size="md">
              {currentVersionHeading}
            </Heading>
          )}
          <Grid color="company" spacing={3} cols={2}>
            {oldDrilldownPages.map((page, idx) => {
              const iconName = (page as any).akselIcon;
              const IconComponent = getIcon(iconName);

              return (
                <ListItem
                  id={idx.toString()}
                  as="a"
                  href={page.url || "#"}
                  size="lg"
                  key={idx}
                  title={page.pageName}
                  variant="subtle"
                  icon={IconComponent}
                />
              );
            })}
          </Grid>
        </div>
      )}

      <div className="help-start-page__question-section">
        {questionAreaHeading && (
          <Heading as="h2" size="md">
            {questionAreaHeading}
          </Heading>
        )}

        {questionArea && questionArea.length > 0 && (
          <Card data-color="neutral">
            {questionArea.map((page, idx) => (
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
        <Heading as="h2" size="md">
          {searchPlaceholder}
        </Heading>
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
          <Heading
            className="help-start-page__help-content-area-heading"
            as="h2"
            size="md"
          >
            {helpContentAreaHeading}
          </Heading>
          <ContentArea {...helpContentArea} />
        </>
      )}
    </Article>
  );
};

export default HelpStartPage;
