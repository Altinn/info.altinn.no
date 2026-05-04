export interface ContentAreaItem {
  componentName: string;
  displayOptionId?: string;
  [key: string]: any;
}

export interface ContentAreaProps {
  componentName?: string;
  items: ContentAreaItem[];
}
