/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

import { IReactProps } from "./IReactProps";
import { IReactComponentProps } from "./IReactComponentProps";
import { BaseReactComponentProps } from "./BaseReactComponentProps";
import { BreadcrumbViewModel } from "./BreadcrumbViewModel";
import { SchemaCategoryViewModel } from "./SchemaCategoryViewModel";
import { ProviderCollection } from "./ProviderCollection";
import { RecommendedSchemaViewModel } from "./RecommendedSchemaViewModel";

export interface SchemaOverviewPageViewModel extends IReactProps, IReactComponentProps, BaseReactComponentProps {
  renderAlternateHeader: boolean;
  title?: string;
  suggestions?: string;
  breadcrumb?: BreadcrumbViewModel;
  schemaCategories: SchemaCategoryViewModel[];
  providerCollections: ProviderCollection[];
  agencyText?: string;
  servicesText?: string;
  providersText?: string;
  recommendedSchemasHeaderText?: string;
  recommendedSchemas: RecommendedSchemaViewModel[];
  initialTab?: string;
}
