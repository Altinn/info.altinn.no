import { Card } from "@digdir/designsystemet-react";
import type { ContentAreaProps, ContentAreaItem } from "./ContentArea.types";
import * as Components from "../../../App.Components";
import "./ContentArea.scss";

interface GroupedItems {
  type: string;
  items: ContentAreaItem[];
  startIndex: number;
}

const ContentArea = ({ items }: ContentAreaProps) => {
  const itemListOfLists: GroupedItems[] = [];
  if (!items) {
    return itemListOfLists;
  }
  for (let i = 0; i < items.length; i++) {
    const currentItem = items[i];
    const newItems: ContentAreaItem[] = [];
    const startIndex = i;
    newItems.push(currentItem);
    if (currentItem.componentName === "SchemaAccordianBlock" || currentItem.componentName === "AccordionBlock") {
      let j = i + 1;
      while (j < items.length && (items[j].componentName === "SchemaAccordianBlock" || items[j].componentName === "AccordionBlock")) {
        newItems.push(items[j]);
        j++;
      }
      i = j - 1;
    }
    itemListOfLists.push({ type: currentItem.componentName, items: newItems, startIndex: startIndex });
  }

  const resolveDisplayClass = (item: ContentAreaItem): string => {
    const id = item?.displayOptionId;
    if (!id) return "display-option--full";
    return `display-option--${id}`;
  };

  return (
    <>
      {itemListOfLists.map(({ type, items, startIndex }, idx1) => {
        if (type === "SchemaAccordianBlock" || type === "AccordionBlock") {
          const cssDisplayOption = resolveDisplayClass(items[0]);
          return (
            <Card data-color="neutral" key={`group-${idx1}`} className={cssDisplayOption}>
              {items.map((item: any, idx2: number) => {
                const Comp = (Components as any)[item.componentName];
                if (!Comp) {
                  console.error(`Component "${item.componentName}" not found in Components registry`);
                  return null;
                }
                const itemKey = `${type}:${startIndex}:${idx2}`;
                return <Comp {...item} key={itemKey} />;
              })}
            </Card>
          );
        }
        return items.map((item: any, idx2: number) => {
          const cssDisplayOption = resolveDisplayClass(item);
          const Comp = (Components as any)[item.componentName];
          if (!Comp) {
            console.error(`Component "${item.componentName}" not found in Components registry`);
            return null;
          }
          const itemKey = `${type}:${startIndex}:${idx2}`;
          return <Comp {...item} className={cssDisplayOption} key={itemKey} />;
        });
      })}
    </>
  );
};

export default ContentArea;
