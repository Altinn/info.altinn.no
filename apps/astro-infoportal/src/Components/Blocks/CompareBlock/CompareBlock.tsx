import { RichTextArea } from "/App.Components";
import "./CompareBlock.scss";

const CompareBlock = ({
  heading,
  compareHeading1,
  compareText1,
  compareHeading2,
  compareText2,
  compareHeading3,
  compareText3,
  compareHeading4,
  compareText4,
}: any) => {
  const hasColumn1 = compareHeading1 || compareText1;
  const hasColumn2 = compareHeading2 || compareText2;
  const hasColumn3 = compareHeading3 || compareText3;
  const hasColumn4 = compareHeading4 || compareText4;

  return (
    <div className="a-compare-category">
      <h2>{heading || ""}</h2>
      <div className="row">
        {hasColumn1 && (
          <div className="a-compare-container col-xs-6 col-md col-max-4">
            <div className="a-compare-element">
              <h3>{compareHeading1 || ""}</h3>
              {compareText1 && <RichTextArea {...compareText1} />}
            </div>
          </div>
        )}
        {hasColumn2 && (
          <div className="a-compare-container col-xs-6 col-md col-max-4">
            <div className="a-compare-element">
              <h3>{compareHeading2 || ""}</h3>
              {compareText2 && <RichTextArea {...compareText2} />}
            </div>
          </div>
        )}
        {hasColumn3 && (
          <div className="a-compare-container col-xs-6 col-md col-max-4">
            <div className="a-compare-element">
              <h3>{compareHeading3 || ""}</h3>
              {compareText3 && <RichTextArea {...compareText3} />}
            </div>
          </div>
        )}
        {hasColumn4 && (
          <div className="a-compare-container col-xs-6 col-md col-max-4">
            <div className="a-compare-element">
              <h3>{compareHeading4 || ""}</h3>
              {compareText4 && <RichTextArea {...compareText4} />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompareBlock;
