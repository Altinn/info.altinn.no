import { ContentArea } from "/App.Components";
import { LinkListBlockViewModel } from "/Models/Generated/LinkListBlockViewModel";
import "./LinkListBlock.scss";

const LinkListBlock = ({ linkArea }: LinkListBlockViewModel) => {
  return (
    <div className="a-list-container mb-3 link-list-block">
      {linkArea && linkArea.items && linkArea.items.length > 0 && (
        <ul className="a-list a-list-noIcon">
          {linkArea.items.map((item, index) => (
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
