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
import { UiText } from "../../Shared/UiLanguage/UiLanguage";
import "./SubsidyPage.scss";
import type { SubsidyPageProps } from "./SubsidyPage.types";

const SubsidyPage = ({
  pageName,
  mainIntro,
  mainBody,
  breadcrumb,
  timeline,
  lastUpdatedDateText,
  lastUpdatedDateString,
  bottomContentArea,
}: SubsidyPageProps) => {
  // `lastUpdatedDateText` is interface text from t("common.lastUpdated"); the
  // dd.mm.yyyy string beside it is digits and belongs to no language, so only
  // the label is marked (issue #713).
  const hasLastUpdate = Boolean(lastUpdatedDateText || lastUpdatedDateString);
  const lastUpdate = (
    <>
      {lastUpdatedDateText && <UiText>{lastUpdatedDateText}</UiText>}
      {lastUpdatedDateText && lastUpdatedDateString ? " " : null}
      {lastUpdatedDateString}
    </>
  );
  const hasTimeline = (timeline?.length ?? 0) > 0;

  return (
    <Article>
      {breadcrumb && <BreadcrumbsView {...breadcrumb} />}
      <ArticleHeader>
        <Heading size="xl" as="h1" weight="bold">
          {pageName || ""}
        </Heading>
        {mainIntro && <Typography>{mainIntro}</Typography>}
        {hasLastUpdate && <Byline size="sm">{lastUpdate}</Byline>}
        {hasLastUpdate && <Divider />}
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
              {timeline!.map(({ heading }: any, i: any) => {
                const anchorId = `s${i + 1}`;
                const link = (
                  <DsLink data-color="neutral" href={`#${anchorId}`}>
                    {heading || ""}
                  </DsLink>
                );
                return (
                  <div
                    className="timeline-header-custom"
                    key={`timeline-nav-${i}`}
                  >
                    {i !== timeline!.length - 1 ? (
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
            {timeline!.map((item: any, i: number) => {
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
                    <h3 className="timeline-item__heading">
                      {item.heading || ""}
                    </h3>
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

export default SubsidyPage;
