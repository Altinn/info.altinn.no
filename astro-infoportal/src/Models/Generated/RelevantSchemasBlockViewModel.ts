/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

import { IReactProps } from "./IReactProps";
import { IReactComponentProps } from "./IReactComponentProps";
import { BaseReactComponentProps } from "./BaseReactComponentProps";
import { RecommendedSchemaViewModel } from "./RecommendedSchemaViewModel";

export interface RelevantSchemasBlockViewModel extends IReactProps, IReactComponentProps, BaseReactComponentProps {
  relevantSchemasHeader?: string;
  schemas: RecommendedSchemaViewModel[];
  showAllSchemasText?: string;
  schemaOverviewPageUrl?: string;
}
