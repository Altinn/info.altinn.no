import { ContentArea } from "/App.Components";
import "./LinkListBlock.scss";

const LinkListBlock = ({ linkArea }: any) => {
  return (
    <div className="a-list-container mb-3 link-list-block">
      {linkArea && linkArea.items && linkArea.items.length > 0 && (
        <ul className="a-list a-list-noIcon">
          {linkArea.items.map((item: any, index: number) => (
            <li key={index} className="a-dotted a-clickable a-list-hasRowLink">
              <ContentArea items={[item]} componentName="ContentArea" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LinkListBlock;
