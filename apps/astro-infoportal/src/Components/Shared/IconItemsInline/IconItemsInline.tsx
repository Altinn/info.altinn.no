import { Byline } from "@altinn/altinn-components";
import './IconItemsInline.scss';

export interface IconItemsInlineItem {
  label: string;
  icon: React.ComponentType<any>;
  url?: string;
  title?: string;
}

interface IconItemsInlineProps {
  items: IconItemsInlineItem[];
  size?: 'sm' | 'md' | 'lg';
  strong?: boolean;
  className?: string;
  textColor?: string;
  disableLinks?: boolean;
}

export const IconItemsInline = ({
  items,
  size = 'md',
  strong = true,
  className = '',
  textColor,
  disableLinks = false
}: IconItemsInlineProps) => {
  if (!items || items.length === 0) return null;

  return (
    <span className={`icon-items-inline ${className}`.trim()}>
      {items.map((item: any, idx: number) => {
        const IconComponent = item.icon;
        const labelContent = strong ? <strong>{item.label}</strong> : item.label;

        const content = (!disableLinks && item.url) ? (
          <a
            href={item.url}
            title={item.title || item.label}
            style={{ textDecoration: 'none', ...(textColor ? { color: textColor } : {}) }}
          >
            {labelContent}
          </a>
        ) : (
          <span style={textColor ? { color: textColor } : {}}>
            {labelContent}
          </span>
        );

        return (
          <Byline key={idx} size={size}>
            <IconComponent fontSize="1.25rem" style={{ marginRight: "0.5rem" }} />
            {content}
          </Byline>
        );
      })}
    </span>
  );
};

export default IconItemsInline;
