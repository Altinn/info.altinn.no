import {
  Article,
  ArticleHeader,
  Byline,
  Divider,
  DsLink,
  Heading,
  Section,
  Timeline,
  TimelineActivity,
  TimelineFooter,
  TimelineSegment,
  Typography,
} from "@altinn/altinn-components";
import { ContentArea, RichTextArea } from "/App.Components";
import BreadcrumbsView from "../../Layout/Breadcrumbs/BreadcrumbsView";
import "./HeroArticlePageBase.scss";

const HeroArticlePageBase = ({
  pageName,
  mainIntro,
  mainBody,
  breadcrumb,
  timeline,
  lastUpdatedDateText,
  lastUpdatedDateString,
  bottomContentArea,
}: any) => {
  const lastUpdateText =
    lastUpdatedDateText && lastUpdatedDateString
      ? `${lastUpdatedDateText} ${lastUpdatedDateString}`
      : lastUpdatedDateText || lastUpdatedDateString || "";
  const hasTimeline = (timeline?.length ?? 0) > 0;

  return (
    <Article>
      {breadcrumb && <BreadcrumbsView {...breadcrumb} />}
      <ArticleHeader>
        <Heading size="xl" as="h1">
          {pageName}
        </Heading>
        {mainIntro && <Typography>{mainIntro}</Typography>}

        {lastUpdateText && <Byline size="sm">{lastUpdateText}</Byline>}
        {lastUpdateText && <Divider />}
      </ArticleHeader>

      {mainBody && (
        <Typography as="div">
          <RichTextArea {...mainBody} />
        </Typography>
      )}

      {hasTimeline && (
        <Section align="start" spacing={4}>
          <div className="timeline-section">
            <Timeline>
              {timeline.map(({ heading }: any, i: any) => {
                const anchorId = `s${i + 1}`;
                const link = (
                  <DsLink data-color="neutral" href={`#${anchorId}`}>
                    {heading}
                  </DsLink>
                );
                return (
                  <div
                    className="timeline-header-custom"
                    key={`timeline-nav-${i}`}
                  >
                    {i !== timeline.length - 1 ? (
                      <TimelineSegment
                        border="solid"
                        icon={{ type: "person", name: (i + 1).toString() }}
                      >
                        <TimelineActivity byline={link} />
                      </TimelineSegment>
                    ) : (
                      <TimelineFooter
                        icon={{ type: "person", name: (i + 1).toString() }}
                      >
                        <TimelineActivity byline={link} />
                      </TimelineFooter>
                    )}
                  </div>
                );
              })}
            </Timeline>
          </div>
        </Section>
      )}

      {hasTimeline && (
        <Section align="start" spacing={4}>
          <div className="timeline-list">
            {timeline.map((item: any, i: number) => {
              const anchorId = `s${i + 1}`;
              return (
                <Section
                  margin="section"
                  className="timeline-item"
                  key={`timeline-item-${i}`}
                  id={anchorId}
                >
                  <div className="timeline-item__title">
                    <span className="timeline-item__circle">{i + 1}</span>
                    <h3 className="timeline-item__heading">{item.heading}</h3>
                  </div>
                  {item.content && <ContentArea {...item.content} />}
                </Section>
              );
            })}
          </div>
        </Section>
      )}

      <Section align="start" spacing={4}>
        {bottomContentArea && <ContentArea {...bottomContentArea} />}
      </Section>
    </Article>
  );
};

export default HeroArticlePageBase;
