import "./HelpPhoneBlock.scss";

const HelpPhoneBlock = ({ phone, phoneLink }: any) => {
  return (
    <a href={phoneLink || "#"} className="a-list-rowLink">
      <div className="row">
        <div className="col">
          <i className="ai ai-phone ai-sm" aria-hidden="true" />
          {phone || ""}
        </div>
      </div>
    </a>
  );
};

export default HelpPhoneBlock;
