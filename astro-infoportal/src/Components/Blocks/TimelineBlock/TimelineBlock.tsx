import { ContentArea } from "/App.Components";
import "./TimelineBlock.scss";

type TimelineBlockProps = {
  timelineItems: any[];
};

const TimelineBlock = ({ timelineItems }: TimelineBlockProps) => {
  return (
    <ol className="timeline-block">
      {timelineItems?.map(({ heading, subHeading, content }, i) => (
        <li key={`timeline-item-${i}`} className="timeline-item">
          <div className="timeline-item-header">
            <span className="timeline-number" aria-hidden="true">
              {i + 1}
            </span>
            <div className="timeline-item-heading">
              <strong>{heading || ""}</strong>
              {subHeading && (
                <span className="timeline-subheading">{subHeading}</span>
              )}
            </div>
          </div>
          {content && (
            <div className="timeline-item-content">
              <ContentArea {...content} />
            </div>
          )}
        </li>
      ))}
    </ol>
  );
};

export default TimelineBlock;
