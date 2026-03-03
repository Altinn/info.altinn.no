/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

import { IReactProps } from "./IReactProps";
import { IReactComponentProps } from "./IReactComponentProps";
import { BaseReactComponentProps } from "./BaseReactComponentProps";
import { SchemaCategoryViewModel } from "./SchemaCategoryViewModel";
import { SchemaAttachmentBlockViewModel } from "./SchemaAttachmentBlockViewModel";
import { ProviderPageViewModel } from "./ProviderPageViewModel";
import { ContentAreaProps } from "./ContentAreaProps";
import { RichTextAreaProps } from "./RichTextAreaProps";
import { OperationalMessageViewModel } from "./OperationalMessageViewModel";
import { BreadcrumbViewModel } from "./BreadcrumbViewModel";

export interface SchemaPageViewModel extends IReactProps, IReactComponentProps, BaseReactComponentProps {
  schemaCategory?: SchemaCategoryViewModel;
  schemaPageNameText?: string;
  schemaCode?: string;
  attachmentText?: string;
  attachments: SchemaAttachmentBlockViewModel[];
  schemaFromProviderText?: string;
  providerPages: ProviderPageViewModel[];
  promoArea?: ContentAreaProps;
  areThereMunicipalities: boolean;
  areThereCounties: boolean;
  subHeading?: string;
  deadline?: RichTextAreaProps;
  deadlineText?: string;
  processTime?: RichTextAreaProps;
  processTimeText?: string;
  fee?: RichTextAreaProps;
  feeText?: string;
  securityLevelInfo?: string;
  mainBody?: RichTextAreaProps;
  preInstansiated: boolean;
  schemaNotInUse: boolean;
  deactivateButton: boolean;
  startSchemaLink?: string;
  startSchemaLinkText?: string;
  buttonInboxText?: string;
  operationalMessages: OperationalMessageViewModel[];
  orangeMessageTitle?: string;
  orangeMessage?: RichTextAreaProps;
  translateCode?: string;
  apiSourceUrl?: string;
  aboutThisSchemaTitleText?: string;
  deepLink?: string;
  shallowLink?: string;
  shallowLinkText?: string;
  accordianList?: ContentAreaProps;
  breadcrumb: BreadcrumbViewModel;
  whatMunicipalityCountyText?: string;
  searchForMunicipalityCountyText?: string;
  noHitText?: string;
}
