import RichTextArea from "../RichTextArea/RichTextArea";
import { useUiLanguage } from "../UiLanguage/UiLanguage";
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
  // The label is interface text while the value beside it is the editor's, so
  // on a page that fell back the two differ in language (issue #713). <dt> is
  // ours already, so it carries the attribute without a wrapper span.
  const uiLang = useUiLanguage();

  if (!items || items.length === 0) return null;

  return (
    <dl className="rich-text-metadata">
      {items.map((item: any, idx: number) => {
        const IconComponent = item.icon;
        return (
          <div key={idx} className="rich-text-metadata__item">
            <IconComponent aria-hidden="true" className="rich-text-metadata__icon" />
            <dt className="rich-text-metadata__label" lang={uiLang}>
              {item.label}:
            </dt>
            <dd className="rich-text-metadata__content">
              {typeof item.content === "string" ? (
                item.content
              ) : (
                <RichTextArea {...item.content} />
              )}
            </dd>
          </div>
        );
      })}
    </dl>
  );
};

export default RichTextMetadata;
