/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

import { IReactProps } from "./IReactProps";
import { IReactComponentProps } from "./IReactComponentProps";
import { BaseReactComponentProps } from "./BaseReactComponentProps";
import { TableRowViewModel } from "./TableRowViewModel";

export interface TableBlockViewModel extends IReactProps, IReactComponentProps, BaseReactComponentProps {
  columnHeader1?: string;
  columnHeader2?: string;
  columnHeader3?: string;
  columnHeader4?: string;
  columnHeader5?: string;
  columnHeader6?: string;
  rows: TableRowViewModel[];
}
