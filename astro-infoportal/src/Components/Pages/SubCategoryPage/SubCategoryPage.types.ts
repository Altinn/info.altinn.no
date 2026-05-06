import type { RichTextAreaProps } from "../../Shared/RichTextArea/RichTextArea.types";

export interface SubCategoryPageProps {
  componentName?: string;
  pageName?: string;
  description?: RichTextAreaProps;
  schemas?: any[];
  breadcrumb?: any;
  boxBlocks?: any;
  promoArea?: any;
  timeline?: any[];
  timelineHeading?: string;
  accordions?: any;
  accordionsHeading?: string;
}
