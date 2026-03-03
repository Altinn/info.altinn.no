/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

import { IReactProps } from "./IReactProps";
import { IReactComponentProps } from "./IReactComponentProps";
import { BaseReactProps } from "./BaseReactProps";

export interface BaseReactComponentProps extends IReactProps, IReactComponentProps, BaseReactProps {
  fullRefreshProperties?: string[];
  componentName: string;
  ope?: { [key: string]: string; };
  displayOptionId?: string;
  displayOptionName?: string;
  displayOptionTag?: string;
}
