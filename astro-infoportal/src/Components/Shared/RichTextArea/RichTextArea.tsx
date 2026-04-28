import * as Components from "../../../App.Components";
import type { RichTextAreaItem, RichTextAreaProps } from "./RichTextArea.types";
import "./RichTextArea.scss";

function isWhitespaceOnlyRichText(item: RichTextAreaItem): boolean {
  return (
    item.componentName === "RichText" &&
    typeof item.html === "string" &&
    item.html.trim() === ""
  );
}

const RichTextArea = ({ items }: RichTextAreaProps) => {
  if (!items || items.length === 0) return null;

  const visibleItems = items.filter((item) => !isWhitespaceOnlyRichText(item));
  if (visibleItems.length === 0) return null;

  return (
    <div className="rich-text-area">
      {visibleItems.map((item: RichTextAreaItem, idx: number) => {
        // @ts-expect-error dynamic component lookup by name
        const Comp = Components[item.componentName];

        if (!Comp) {
          console.error(`Component "${item.componentName}" not found in Components registry`);
          return null;
        }

        return <Comp {...item} key={idx} />;
      })}
    </div>
  );
};

export default RichTextArea;
