import {
  Article,
  ArticleHeader,
  DsLink,
  Heading,
  Typography,
} from "@altinn/altinn-components";
import TimelineBlock from "../../Blocks/TimelineBlock/TimelineBlock";
import BreadcrumbsView from "../../Layout/Breadcrumbs/BreadcrumbsView";
import ContentArea from "../../Shared/ContentArea/ContentArea";
import RichTextArea from "../../Shared/RichTextArea/RichTextArea";
import "./HelpProcessArticlePage.scss";

const HelpProcessArticlePage = ({
  pageName,
  mainIntro,
  mainBody,
  timeline,
  bottomContentArea,
  linkToPortalProcess,
  lastUpdatedDateText,
  lastUpdatedDateString,
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

      {mainBody && <RichTextArea {...mainBody} />}

      {timeline && timeline.length > 0 && <TimelineBlock timelineItems={timeline} />}

      {bottomContentArea && <ContentArea {...bottomContentArea} />}

      {linkToPortalProcess && (
        <Typography>
          <DsLink href={linkToPortalProcess}>Portal Process Link</DsLink>
        </Typography>
      )}

      {lastUpdatedDateText && lastUpdatedDateString && (
        <Typography size="sm">
          {lastUpdatedDateText}: {lastUpdatedDateString}
        </Typography>
      )}
    </Article>
  );
};

export default HelpProcessArticlePage;
