/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

import { IReactProps } from "./IReactProps";
import { IReactComponentProps } from "./IReactComponentProps";
import { BaseReactComponentProps } from "./BaseReactComponentProps";
import { AccountIconViewModel } from "./AccountIconViewModel";
import { AccountBadgeViewModel } from "./AccountBadgeViewModel";

export interface AccountItemViewModel extends IReactProps, IReactComponentProps, BaseReactComponentProps {
  id?: string;
  name?: string;
  title?: string;
  type?: string;
  groupId?: string;
  uniqueId?: string;
  description?: string;
  isCurrentEndUser: boolean;
  isDeleted: boolean;
  favourite: boolean;
  disabled: boolean;
  parentId?: string;
  icon?: AccountIconViewModel;
  badge?: AccountBadgeViewModel;
}
