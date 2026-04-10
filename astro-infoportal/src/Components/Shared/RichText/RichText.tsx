import "./RichText.scss";

const RichText = ({ html }: any) => {

  return (
    <div className="rich-text" dangerouslySetInnerHTML={{ __html: html }} />
  );
};

export default RichText;
