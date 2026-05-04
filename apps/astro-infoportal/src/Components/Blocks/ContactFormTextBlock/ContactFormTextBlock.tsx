import { RichTextArea } from "/App.Components";
import "./ContactFormTextBlock.scss";

const ContactFormTextBlock = ({
  heading,
  contactHeading,
  teaserText,
}: any) => {
  return (
    <div className="tab-pane contact-form-text-block" id={heading?.replace(/\s/g, "") || ""} role="tabpanel">
      <h3 className="a-h2">{contactHeading || ""}</h3>
      {teaserText && <RichTextArea {...teaserText} />}
    </div>
  );
};

export default ContactFormTextBlock;
