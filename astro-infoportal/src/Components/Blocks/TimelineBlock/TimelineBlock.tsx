import {
  Timeline,
  TimelineActivity,
  TimelineHeader,
  TimelineSection,
} from "@altinn/altinn-components";
import { Fragment } from "react";
import { ContentArea } from "/App.Components";
import "./TimelineBlock.scss";
import { TimelineItemBlockViewModel } from "/Models/Generated/TimelineItemBlockViewModel";

type TimelineBlockProps = {
  timelineItems: TimelineItemBlockViewModel[];
};

const TimelineBlock = ({ timelineItems }: TimelineBlockProps) => {
  return (
    <div className="timeline-block">
      <Timeline>
        {timelineItems?.map(({ heading, subHeading, content }, i) => (
          <Fragment key={`timeline-item-${i}`}>
            <div className="timeline-header-custom">
              <TimelineHeader icon={{ type: "person", name: (i + 1).toString() }}>
                <b>{heading || ""}</b>
              </TimelineHeader>
            </div>
            <TimelineSection border="hidden" byline={subHeading}>
              <TimelineActivity>
                {content && <ContentArea {...content} />}
              </TimelineActivity>
            </TimelineSection>
          </Fragment>
        ))}
      </Timeline>
    </div>
  );
};

export default TimelineBlock;
