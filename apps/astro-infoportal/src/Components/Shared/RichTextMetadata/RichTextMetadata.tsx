import RichTextArea from "../RichTextArea/RichTextArea";
import "./RichTextMetadata.scss";

export interface RichTextMetadataItem {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  content: any;
}

interface RichTextMetadataProps {
  items: RichTextMetadataItem[];
}

export const RichTextMetadata = ({ items }: RichTextMetadataProps) => {
  if (!items || items.length === 0) return null;

  return (
    <dl className="rich-text-metadata">
      {items.map((item: any, idx: number) => {
        const IconComponent = item.icon;
        return (
          <div key={idx} className="rich-text-metadata__item">
            <IconComponent aria-hidden="true" className="rich-text-metadata__icon" />
            <dt className="rich-text-metadata__label">{item.label}:</dt>
            <dd className="rich-text-metadata__content">
              <RichTextArea {...item.content} />
            </dd>
          </div>
        );
      })}
    </dl>
  );
};

export default RichTextMetadata;
