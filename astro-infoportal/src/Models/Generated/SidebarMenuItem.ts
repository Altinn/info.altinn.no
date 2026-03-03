/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

import { IReactProps } from "./IReactProps";
import { IReactComponentProps } from "./IReactComponentProps";
import { BaseReactComponentProps } from "./BaseReactComponentProps";

export interface SidebarMenuItem extends IReactProps, IReactComponentProps, BaseReactComponentProps {
  label?: string;
  url?: string;
  icon?: string;
  current?: boolean;
  subItems?: SidebarMenuItem[];
}
