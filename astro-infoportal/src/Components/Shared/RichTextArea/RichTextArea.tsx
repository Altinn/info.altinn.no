import * as Components from "../../../App.Components";
import type { RichTextAreaItem, RichTextAreaProps } from "./RichTextArea.types";

// RichText HTML is transformed up-front by walkAndTransformRichText in the
// server-side JSON transformer pipeline, so this component is a dumb renderer.
// Running node-html-parser here too would re-introduce SSR/client hydration
// mismatches (the parser's round-trip is not byte-identical across runtimes).
const RichTextArea = ({ items }: RichTextAreaProps) => {
  if (!items || items.length === 0) return null;

  return items.map((item: RichTextAreaItem, idx: number) => {
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
