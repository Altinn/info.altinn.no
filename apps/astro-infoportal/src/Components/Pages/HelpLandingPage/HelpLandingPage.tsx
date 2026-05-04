import {
  Article,
  ArticleHeader,
  Heading,
  Typography,
} from "@altinn/altinn-components";
import { Card, Details } from "@digdir/designsystemet-react";
import BreadcrumbsView from "../../Layout/Breadcrumbs/BreadcrumbsView";
import ContentArea from "../../Shared/ContentArea/ContentArea";
import RichTextArea from "../../Shared/RichTextArea/RichTextArea";
import "./HelpLandingPage.scss";

const HelpLandingPage = ({
  pageName,
  mainIntro,
  questionHeading,
  topicName,
  childPages,
  bottomContentArea,
  breadcrumb,
}: any) => {
  return (
    <Article>
      {breadcrumb && <BreadcrumbsView {...breadcrumb} />}
      <ArticleHeader>
        <Heading size="xl" as="h1">
          {pageName}
        </Heading>
        {mainIntro && (
          <Typography>
            <p>{mainIntro}</p>
          </Typography>
        )}
      </ArticleHeader>

      {questionHeading && <Typography as="h2">{questionHeading}</Typography>}

      {topicName && <Typography as="p">{topicName}</Typography>}

      {childPages && childPages.length > 0 && (
        <Card data-color="neutral">
          {childPages.map((page: any, idx: number) => (
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

      {bottomContentArea && <ContentArea {...bottomContentArea} />}
    </Article>
  );
};

export default HelpLandingPage;
