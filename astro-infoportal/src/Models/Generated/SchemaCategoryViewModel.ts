/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

import { IReactProps } from "./IReactProps";
import { IReactComponentProps } from "./IReactComponentProps";
import { BaseReactComponentProps } from "./BaseReactComponentProps";
import { SchemaSubCategoryViewModel } from "./SchemaSubCategoryViewModel";

export interface SchemaCategoryViewModel extends IReactProps, IReactComponentProps, BaseReactComponentProps {
  category?: string;
  categoryId: number;
  subCategory?: string;
  subCategoryId?: number;
  subCategories?: SchemaSubCategoryViewModel[];
  current?: boolean;
  url?: string;
  icon?: string;
}
