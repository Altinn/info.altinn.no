import type { RichTextAreaProps } from "/Models/Generated/RichTextAreaProps";
import * as Components from "../../../App.Components";

const RichTextArea = ({ items }: RichTextAreaProps) => {
  if (!items || items.length === 0) return null;

  return items.map((item, idx) => {
    // @ts-expect-error
    const Comp = Components[item.componentName];

    if (!Comp) {
      console.error(`Component "${item.componentName}" not found in Components registry`);
      return null;
    }

    return <Comp {...item} key={idx} />;
  });
};

export default RichTextArea;
