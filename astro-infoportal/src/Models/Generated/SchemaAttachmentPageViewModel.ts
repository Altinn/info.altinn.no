/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

import { IReactProps } from "./IReactProps";
import { IReactComponentProps } from "./IReactComponentProps";
import { BaseReactComponentProps } from "./BaseReactComponentProps";
import { ProviderIconBlockViewModel } from "./ProviderIconBlockViewModel";
import { RichTextAreaProps } from "./RichTextAreaProps";
import { ContentAreaProps } from "./ContentAreaProps";
import { SchemaDataViewModel } from "./SchemaDataViewModel";
import { BreadcrumbViewModel } from "./BreadcrumbViewModel";
import { OperationalMessageViewModel } from "./OperationalMessageViewModel";

export interface SchemaAttachmentPageViewModel extends IReactProps, IReactComponentProps, BaseReactComponentProps {
  pageName?: string;
  url?: string;
  schemaCode?: string;
  attachmentBadgeText?: string;
  ownerProviders?: ProviderIconBlockViewModel[];
  mainIntro?: RichTextAreaProps;
  orangeMessageTitle?: string;
  orangeMessage?: RichTextAreaProps;
  accordianList?: ContentAreaProps;
  whereToFindSchemaText?: string;
  relatedSchemas?: SchemaDataViewModel[];
  promoArea?: ContentAreaProps;
  breadcrumb?: BreadcrumbViewModel;
  criticalMessages?: OperationalMessageViewModel[];
  missingTranslation?: boolean;
  missingTranslationText?: string;
}
