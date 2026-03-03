/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

import { IReactProps } from "./IReactProps";
import { IReactComponentProps } from "./IReactComponentProps";
import { BaseReactComponentProps } from "./BaseReactComponentProps";
import { LinkItemViewModel } from "./LinkItemViewModel";
import { ModalContentViewModel } from "./ModalContentViewModel";

export interface BoxBlockViewModel extends IReactProps, IReactComponentProps, BaseReactComponentProps {
  type: string;
  link: LinkItemViewModel;
  description: string;
  color: string;
  title: string;
  modal: ModalContentViewModel;
}
