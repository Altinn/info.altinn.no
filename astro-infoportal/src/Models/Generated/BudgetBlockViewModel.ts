/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

import { IReactProps } from "./IReactProps";
import { IReactComponentProps } from "./IReactComponentProps";
import { BaseReactComponentProps } from "./BaseReactComponentProps";
import { BudgetLineViewModel } from "./BudgetLineViewModel";

export interface BudgetBlockViewModel extends IReactProps, IReactComponentProps, BaseReactComponentProps {
  budgetDetails: BudgetLineViewModel[];
  sumDescriptionText?: string;
  sumValueText?: string;
}
