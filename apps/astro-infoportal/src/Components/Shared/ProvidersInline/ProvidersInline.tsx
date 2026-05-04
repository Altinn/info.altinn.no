import { Byline } from "@altinn/altinn-components";
import "./ProvidersInline.scss";

export interface ProviderInlineItem {
  name: string;
  imageUrl: string;
  url?: string;
  title?: string;
}

interface ProvidersInlineProps {
  providers?: ProviderInlineItem[];
  size?: "xs" | "sm" | "md" | "lg";
  strong?: boolean;
  className?: string;
  textColor?: string;
  disableLinks?: boolean;
  andMoreText?: string;
  isStartPage?: boolean;
}

export const ProvidersInline = ({
  providers,
  size = "sm",
  strong = true,
  className = "",
  textColor,
  disableLinks = false,
  andMoreText,
  isStartPage = false,
}: ProvidersInlineProps) => {
  if (!providers?.length) return null;

  const shouldTruncate = isStartPage && providers.length > 1 && andMoreText;
  const displayProviders = shouldTruncate ? [providers[0]] : providers;

  return (
    <ul className={`providers-inline ${className}`.trim()}>
      {displayProviders.map((p: any, idx: number) => {
        const textStyle = textColor ? { color: textColor } : undefined;
        const nameEl = strong ? <strong>{p.name}</strong> : p.name;

        const content =
          !disableLinks && p.url ? (
            <a href={p.url} title={p.title || p.name} style={textStyle}>
              {nameEl}
            </a>
          ) : textColor ? (
            <span style={textStyle}>{nameEl}</span>
          ) : (
            nameEl
          );

        return (
          <Byline
            as="li"
            key={idx}
            avatar={{ name: p.name, imageUrl: p.imageUrl, type: "company"}}
            size={size}
            color="company"
          >
            {content}
          </Byline>
        );
      })}
      {shouldTruncate && (
        <span className="providers-inline__and-more">{andMoreText}</span>
      )}
    </ul>
  );
};

export default ProvidersInline;
