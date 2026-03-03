import { HelpContactBlockViewModel } from "/Models/Generated/HelpContactBlockViewModel";
import "./HelpContactBlock.scss";

const HelpContactBlock = ({ contactFormUrl, writeToUsText }: HelpContactBlockViewModel) => {
  return (
    <a
      href="javascript:void(0)"
      className="a-list-rowLink"
      data-toggle="altinn-modal"
      data-action="load"
      data-url={contactFormUrl || ""}
      data-target="#modal"
    >
      <div className="row">
        <div className="col">
          <i className="ai ai-send ai-sm" aria-hidden="true" />
          {writeToUsText || ""}
        </div>
      </div>
    </a>
  );
};

export default HelpContactBlock;
