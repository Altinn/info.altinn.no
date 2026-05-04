import { useMemo } from "react";
import * as Components from "../../../App.Components";
import { transformRichTextHtml } from "../RichText/htmlTransforms";
import type { RichTextAreaItem, RichTextAreaProps } from "./RichTextArea.types";

const RichTextArea = ({ items, addAnchors = false }: RichTextAreaProps) => {
  const processedItems = useMemo(() => {
    if (!items || items.length === 0) return items;

    const usedIds = new Set<string>();
    return items.map((item) => {
      if (item.componentName !== "RichText" || typeof item.html !== "string") {
        return item;
      }
      return {
        ...item,
        html: transformRichTextHtml(item.html, { usedIds, addAnchors }),
      };
    });
  }, [items, addAnchors]);

  if (!processedItems || processedItems.length === 0) return null;

  return processedItems.map((item: RichTextAreaItem, idx: number) => {
    // @ts-expect-error dynamic component lookup by name
    const Comp = Components[item.componentName];

    if (!Comp) {
      console.error(
        `Component "${item.componentName}" not found in Components registry`,
      );
      return null;
    }

    return <Comp {...item} key={idx} />;
  });
};

export default RichTextArea;
