export interface RichTextAreaItem {
  componentName: string;
  [key: string]: unknown;
}

export interface RichTextAreaProps {
  items: RichTextAreaItem[];
}
