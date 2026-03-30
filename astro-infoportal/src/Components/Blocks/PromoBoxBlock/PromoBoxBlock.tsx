import { Icon } from "@altinn/altinn-components";
import Image from "../../Shared/Image/Image";
import RichTextArea from "../../Shared/RichTextArea/RichTextArea";
import "./PromoBoxBlock.scss";
import { ChevronRightIcon } from "@navikt/aksel-icons";

const PromoBoxBlock = ({ image, text, link }: any) => {
  const decodeHtmlEntities = (str: string): string => {
    if (!str) return "";

    // Common HTML entities map for SSR compatibility
    const entities: { [key: string]: string } = {
      "&amp;": "&",
      "&lt;": "<",
      "&gt;": ">",
      "&quot;": '"',
      "&#39;": "'",
      "&apos;": "'",
      "&nbsp;": " ",
      "&aring;": "å",
      "&Aring;": "Å",
      "&aelig;": "æ",
      "&AElig;": "Æ",
      "&oslash;": "ø",
      "&Oslash;": "Ø",
      "&eacute;": "é",
      "&Eacute;": "É",
      "&ouml;": "ö",
      "&Ouml;": "Ö",
      "&auml;": "ä",
      "&Auml;": "Ä",
    };

    let decoded = str;

    // Replace named entities
    for (const [entity, char] of Object.entries(entities)) {
      decoded = decoded.replace(new RegExp(entity, "g"), char);
    }

    // Replace numeric entities (&#nnnn; or &#xhhhh;)
    decoded = decoded.replace(/&#(\d+);/g, (_match, dec) => {
      return String.fromCharCode(Number.parseInt(dec, 10));
    });
    decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (_match, hex) => {
      return String.fromCharCode(Number.parseInt(hex, 16));
    });

    return decoded;
  };

  const extractLinkInfo = (htmlString: string) => {
    if (!htmlString) {
      return { url: "", text: "" };
    }

    // Use consistent regex parsing for both server and client
    const hrefMatch = htmlString.match(/href=["']([^"']*)["']/);
    const textMatch = htmlString.match(/>([^<]*)<\/a>/);

    if (hrefMatch && textMatch) {
      return {
        url: hrefMatch[1] || "",
        text: decodeHtmlEntities(textMatch[1] || ""),
      };
    }

    return { url: "", text: "" };
  };

  const getHtmlFromItems = (): string => {
    if (!text || !text.items || text.items.length === 0) {
      return "";
    }

    const richTextItem = text.items.find((item: any) => {
      return (
        typeof item === "object" &&
        item !== null &&
        "html" in item &&
        typeof (item as any).html === "string"
      );
    });

    if (richTextItem && "html" in richTextItem) {
      return (richTextItem as any).html || "";
    }

    return "";
  };

  // Determine link info: prioritize explicit link prop, fallback to HTML extraction
  let finalLinkUrl = "";
  let finalLinkText = "";

  if (link && link.url && link.text) {
    // Use explicit link prop if available
    finalLinkUrl = link.url;
    finalLinkText = link.text;
  } else {
    // Fallback to extracting link from HTML text
    const htmlContent = getHtmlFromItems();
    const linkInfo = extractLinkInfo(htmlContent);
    finalLinkUrl = linkInfo.url;
    finalLinkText = linkInfo.text;
  }

  const hasValidLink = finalLinkUrl && finalLinkText;

  return (
    <li className="promo-box-block__list-item">
      {image && image.src && <Image {...image} />}
      {hasValidLink ? (
        <a href={finalLinkUrl} className="promo-box-block__link">
          {finalLinkText}{" "}
          <span className="promo-box-block__icon">
            <Icon
              aria-hidden="true"
              svgElement={ChevronRightIcon}
              style={{
                fontSize: "1.5rem",
              }}
            />
          </span>
        </a>
      ) : (
         text && <RichTextArea {...text} />
      )}
    </li>
  );
};

export default PromoBoxBlock;
